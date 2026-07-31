import {
  extractTemporalExpressions,
  normalizeAiInterpretation,
  RawInterpretation,
} from './ai-interpretation-normalizer';
import { AiIntent } from '../types/ai-intent.enum';

describe('normalizeAiInterpretation', () => {
  it('extracts hoje, ontem, amanha and periods', () => {
    expect(extractTemporalExpressions('Hoje de manha o Thor vomitou')).toEqual({
      relativeDate: 'hoje',
      period: 'manha',
    });

    expect(extractTemporalExpressions('Anota que foi ontem a noite')).toEqual({
      relativeDate: 'ontem',
      period: 'noite',
    });

    expect(extractTemporalExpressions('Aplicar remedio amanha a tarde')).toEqual({
      relativeDate: 'amanha',
      period: 'tarde',
    });
  });

  it('keeps amount undefined when there is no explicit money context', () => {
    const raw: RawInterpretation = {
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.9,
      entities: {
        petName: 'Luna',
        item: 'racao',
        amount: 0,
        quantity: 1,
      },
      missingFields: [],
      requiresConfirmation: true,
    };

    const result = normalizeAiInterpretation({
      raw,
      includeParsedEntities: true,
      userMessage: 'Comprei ração para a Luna.',
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Luna',
      item: 'racao',
    });
    expect((result.entities as Record<string, unknown>).amount).toBeUndefined();
  });

  it('reconciles consulta domain and amount with hoje', () => {
    const raw: RawInterpretation = {
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.95,
      entities: {
        petName: 'Mel',
        amount: 230,
      },
      missingFields: [],
      requiresConfirmation: true,
    };

    const result = normalizeAiInterpretation({
      raw,
      includeParsedEntities: true,
      userMessage: 'A consulta da Mel custou 230 reais hoje.',
    });

    expect(result.entities).toMatchObject({
      petName: 'Mel',
      amount: 230,
      item: 'consulta',
      category: 'veterinaria',
      relativeDate: 'hoje',
    });
  });

  it('recovers veterinary expense domain when model returns only petName and amount', () => {
    const raw: RawInterpretation = {
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.95,
      entities: {
        petName: 'Max',
        amount: 150,
      },
      missingFields: [],
      requiresConfirmation: true,
    };

    const result = normalizeAiInterpretation({
      raw,
      includeParsedEntities: true,
      userMessage: 'O Max foi ao veterinário e gastei 150 reais.',
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Max',
      amount: 150,
      item: 'consulta veterinaria',
      category: 'veterinaria',
    });
    expect(result.requiresConfirmation).toBe(true);
  });

  it.each([
    ['R$ 42', 42],
    ['R$ 1234', 1234],
    ['R$ 42,50', 42.5],
    ['R$ 1234,56', 1234.56],
    ['R$ 1.234,56', 1234.56],
  ])('parses monetary amount %s correctly', (amountText, expectedAmount) => {
    const raw: RawInterpretation = {
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.9,
      entities: {
        petName: 'Chico',
        item: 'petisco',
        amount: 42,
        quantity: 3,
        unit: 'pacotes',
      },
      missingFields: [],
      requiresConfirmation: true,
    };

    const result = normalizeAiInterpretation({
      raw,
      includeParsedEntities: true,
      userMessage: `Peguei três pacotes de petisco por ${amountText} para o Chico.`,
    });

    expect(result.entities).toMatchObject({
      amount: expectedAmount,
    });
  });

  it.each([
    ['Comprei meio quilo de ração para a Maya por cinquenta reais.', 0.5, 'kg', 50],
    ['Comprei um quilo e meio de ração para a Maya por setenta reais.', 1.5, 'kg', 70],
    [
      'Comprei dois quilos e meio de ração para a Maya por cento e dois reais.',
      2.5,
      'kg',
      102,
    ],
  ])(
    'parses fractional quantity for phrase %s',
    (userMessage, expectedQuantity, expectedUnit, expectedAmount) => {
      const raw: RawInterpretation = {
        intent: AiIntent.REGISTER_EXPENSE,
        confidence: 0.9,
        entities: {
          petName: 'Maya',
          item: 'racao',
          quantity: 1,
          unit: 'kg',
          amount: 10,
        },
        missingFields: [],
        requiresConfirmation: true,
      };

      const result = normalizeAiInterpretation({
        raw,
        includeParsedEntities: true,
        userMessage,
      });

      expect(result.entities).toMatchObject({
        quantity: expectedQuantity,
        unit: expectedUnit,
        amount: expectedAmount,
      });
    },
  );

  it('keeps deterministic confirmation contract for write intents', () => {
    const eventResult = normalizeAiInterpretation({
      raw: {
        intent: AiIntent.CREATE_EVENT,
        confidence: 0.9,
        entities: {
          petName: 'Thor',
          type: 'CHECKUP',
          description: 'Vet check',
        },
      },
      includeParsedEntities: true,
      userMessage: 'Evento de checkup do Thor.',
    });

    const expenseResult = normalizeAiInterpretation({
      raw: {
        intent: AiIntent.REGISTER_EXPENSE,
        confidence: 0.9,
        entities: {
          petName: 'Thor',
          item: 'Racao',
          amount: 200,
          quantity: 15,
          unit: 'kg',
        },
      },
      includeParsedEntities: true,
      userMessage: 'Gastei 200 reais em 15 quilos de ração para o Thor.',
    });

    expect(eventResult.requiresConfirmation).toBe(true);
    expect(eventResult.missingFields.length).toBeGreaterThan(0);
    expect(expenseResult.requiresConfirmation).toBe(true);
    expect(expenseResult.missingFields.length).toBeGreaterThan(0);
  });
});
