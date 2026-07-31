import { AiIntent } from '../types/ai-intent.enum';
import { OllamaAiProvider } from './ollama-ai.provider';

type MockFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe('OllamaAiProvider normalization', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.OLLAMA_BASE_URL;
  const originalModel = process.env.OLLAMA_MODEL;

  beforeEach(() => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.OLLAMA_MODEL = 'qwen3.5:9b';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OLLAMA_BASE_URL = originalBaseUrl;
    process.env.OLLAMA_MODEL = originalModel;
  });

  it('keeps confidence 0.95 as 0.95', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.95,
      entities: {
        petName: 'Thor',
        type: 'VACCINE',
        description: 'Rabies vaccine',
        frequency: 1,
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage: 'event ...',
      includeParsedEntities: true,
    });

    expect(result.confidence).toBe(0.95);
  });

  it('normalizes confidence 100 to 1', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 100,
      entities: {
        petName: 'Thor',
        type: 'CHECKUP',
        description: 'Vet visit',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage: 'event ...',
      includeParsedEntities: true,
    });

    expect(result.confidence).toBe(1);
  });

  it('cleans entities for UNKNOWN intent', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.UNKNOWN,
      confidence: 0.45,
      entities: {
        item: 'should be ignored',
      },
      missingFields: ['item'],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage: 'random message',
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.UNKNOWN);
    expect(result.entities).toEqual({});
    expect(result.missingFields).toEqual([]);
  });

  it('removes expense-only fields from CREATE_EVENT entities', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.88,
      entities: {
        petName: 'Thor',
        type: 'vaccine',
        description: 'Applied',
        frequency: 2,
        relativeDate: 'hoje',
        period: 'manha',
        item: 'Food',
        category: 'food',
        amount: 10,
        quantity: 15,
        unit: 'kg',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage: 'event ...',
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.CREATE_EVENT);
    expect(result.entities).toEqual({
      petName: 'Thor',
      type: 'VACCINE',
      description: 'Applied',
      frequency: 2,
      relativeDate: 'hoje',
      period: 'manha',
    });
  });

  it('removes event-only fields from REGISTER_EXPENSE entities', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'Gastei 199,90 reais em 15 kg de Royal Canin para o Thor hoje de manha.';
    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.91,
      entities: {
        petName: 'Thor',
        item: 'Royal Canin',
        category: 'food',
        amount: 199.9,
        quantity: 15,
        unit: 'kg',
        type: 'VACCINE',
        description: 'Applied',
        frequency: 2,
        relativeDate: 'hoje',
        period: 'manha',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Thor',
      item: 'Royal Canin',
      category: 'food',
      amount: 199,
      quantity: 15,
      unit: 'kg',
    });
    expect((result.entities as Record<string, unknown>).type).toBeUndefined();
    expect((result.entities as Record<string, unknown>).description).toBeUndefined();
    expect((result.entities as Record<string, unknown>).frequency).toBeUndefined();
  });

  it('requires confirmation for write intents through non-empty missingFields', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.85,
      entities: {
        petName: 'Thor',
        type: 'CHECKUP',
        description: 'Vet check',
      },
      missingFields: [],
      requiresConfirmation: false,
    });

    const createEvent = await provider.interpret({
      userMessage: 'event ...',
      includeParsedEntities: true,
    });

    expect(createEvent.intent).toBe(AiIntent.CREATE_EVENT);
    expect(createEvent.missingFields.length).toBeGreaterThan(0);

    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.89,
      entities: {
        petName: 'Thor',
        item: 'Food',
        category: 'food',
        amount: 10,
        quantity: 1,
        unit: 'kg',
      },
      missingFields: [],
      requiresConfirmation: false,
    });

    const registerExpense = await provider.interpret({
      userMessage: 'expense ...',
      includeParsedEntities: true,
    });

    expect(registerExpense.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(registerExpense.missingFields.length).toBeGreaterThan(0);
  });

  it('normalizes complete CREATE_EVENT with requiresConfirmation false to true', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.9,
      entities: {
        petName: 'Thor',
        type: 'VACCINE',
        description: 'Rabies vaccine',
        frequency: 1,
      },
      missingFields: [],
      requiresConfirmation: false,
    });

    const result = (await provider.interpret({
      userMessage: 'event ...',
      includeParsedEntities: true,
    })) as { requiresConfirmation: boolean };

    expect(result.requiresConfirmation).toBe(true);
  });

  it('normalizes complete REGISTER_EXPENSE with requiresConfirmation false to true', async () => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.9,
      entities: {
        petName: 'Thor',
        item: 'Royal Canin',
        category: 'food',
        amount: 199.9,
        quantity: 15,
        unit: 'kg',
      },
      missingFields: [],
      requiresConfirmation: false,
    });

    const result = (await provider.interpret({
      userMessage: 'expense ...',
      includeParsedEntities: true,
    })) as { requiresConfirmation: boolean };

    expect(result.requiresConfirmation).toBe(true);
  });

  it('sends think false, stream false, and temperature 0', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });

    await provider.interpret({
      userMessage: 'Ola',
      includeParsedEntities: true,
    });

    expect(capture.body.think).toBe(false);
    expect(capture.body.stream).toBe(false);
    expect(capture.body.options.temperature).toBe(0);
  });

  it('includes symptom to CREATE_EVENT rule in system prompt', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });

    await provider.interpret({
      userMessage: 'Hoje o Thor vomitou duas vezes de manha.',
      includeParsedEntities: true,
    });

    const systemPrompt = capture.body.messages[0].content as string;
    expect(systemPrompt).toContain('sintoma -> CREATE_EVENT');
  });

  it('includes amount, quantity, and unit differentiation in system prompt', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });

    await provider.interpret({
      userMessage: 'Gastei 189 reais em 15 quilos de racao para o Thor.',
      includeParsedEntities: true,
    });

    const systemPrompt = capture.body.messages[0].content as string;
    expect(systemPrompt).toContain('amount is only money value');
    expect(systemPrompt).toContain('quantity is amount bought');
    expect(systemPrompt).toContain('unit is quantity unit like kg and never currency');
  });

  it('sends schema with petName, frequency, item, amount, quantity, and unit', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });

    await provider.interpret({
      userMessage: 'Mensagem de teste',
      includeParsedEntities: true,
    });

    const entitySchema = capture.body.format.properties.entities.properties;
    expect(entitySchema.petName).toBeDefined();
    expect(entitySchema.frequency).toBeDefined();
    expect(entitySchema.item).toBeDefined();
    expect(entitySchema.amount).toBeDefined();
    expect(entitySchema.quantity).toBeDefined();
    expect(entitySchema.unit).toBeDefined();
  });

  it('forwards full user message to the request body', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });
    const userMessage = 'Hoje o Thor vomitou duas vezes de manha.';

    await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(capture.body.messages[1].content).toBe(userMessage);
  });

  it('sends closed schemas with additionalProperties false', async () => {
    const provider = new OllamaAiProvider();
    const capture = mockFetchCapture({
      intent: AiIntent.UNKNOWN,
      confidence: 0.4,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    });

    await provider.interpret({
      userMessage: 'Mensagem de teste',
      includeParsedEntities: true,
    });

    expect(capture.body.format.additionalProperties).toBe(false);
    expect(capture.body.format.properties.entities.additionalProperties).toBe(false);
  });

  it('keeps useful description for vomit paraphrase and does not invent frequency', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'A Luna colocou toda a comida para fora depois do almoço.';
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.95,
      entities: {
        petName: 'Luna',
        type: 'BEHAVIOR',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.CREATE_EVENT);
    expect(result.entities).toMatchObject({
      petName: 'Luna',
      description: userMessage,
    });
    expect((result.entities as Record<string, unknown>).frequency).toBeUndefined();
  });

  it('extracts explicit ontem a noite to relativeDate and period', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'Anota que o Bob não quis comer ontem à noite.';
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.95,
      entities: {
        petName: 'Bob',
        type: 'SYMPTOM',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.CREATE_EVENT);
    expect(result.entities).toMatchObject({
      petName: 'Bob',
      relativeDate: 'ontem',
      period: 'noite',
    });
  });

  it('parses amount 140 from cento e quarenta reais', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'Comprei dois sacos de ração por cento e quarenta reais para o Bob.';
    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.95,
      entities: {
        petName: 'Bob',
        item: 'racao',
        amount: 40,
        quantity: 2,
        unit: 'sacos',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Bob',
      amount: 140,
      quantity: 2,
      unit: 'sacos',
      item: 'racao',
    });
  });

  it('preserves consulta domain and hoje expression for consultation expense', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'A consulta da Mel custou 230 reais hoje.';
    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.95,
      entities: {
        petName: 'Mel',
        amount: 230,
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Mel',
      amount: 230,
      item: 'consulta',
      category: 'veterinaria',
      relativeDate: 'hoje',
    });
  });

  it('preserves original vague event description and avoids specific symptom typing', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'O Thor está estranho.';
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.95,
      entities: {
        petName: 'Thor',
        type: 'SYMPTOM',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.CREATE_EVENT);
    expect(result.entities).toMatchObject({
      petName: 'Thor',
      description: userMessage,
      type: 'BEHAVIOR',
    });
  });

  it('keeps amount absent when purchase has no explicit monetary value', async () => {
    const provider = new OllamaAiProvider();
    const userMessage = 'Comprei ração para a Luna.';
    mockFetchWithModelPayload({
      intent: AiIntent.REGISTER_EXPENSE,
      confidence: 0.95,
      entities: {
        petName: 'Luna',
        item: 'racao',
        amount: 0,
        quantity: 1,
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(AiIntent.REGISTER_EXPENSE);
    expect(result.entities).toMatchObject({
      petName: 'Luna',
      item: 'racao',
    });
    expect((result.entities as Record<string, unknown>).amount).toBeUndefined();
  });

  it.each([
    ['Quando foi a última vacina da Nina?', AiIntent.UNKNOWN],
    ['Qual foi a última consulta do Thor?', AiIntent.UNKNOWN],
    ['Registra a vacina da Nina hoje.', AiIntent.CREATE_EVENT],
    ['Anota que o Thor foi à consulta hoje.', AiIntent.CREATE_EVENT],
  ])('classifies message "%s" as %s', async (userMessage, expectedIntent) => {
    const provider = new OllamaAiProvider();
    mockFetchWithModelPayload({
      intent: AiIntent.CREATE_EVENT,
      confidence: 0.95,
      entities: {
        petName: 'Nina',
        type: 'VACCINE',
        description: 'Registro de vacina',
      },
      missingFields: [],
      requiresConfirmation: true,
    });

    const result = await provider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    expect(result.intent).toBe(expectedIntent);
  });
});

function mockFetchWithModelPayload(payload: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      message: {
        content: JSON.stringify(payload),
      },
    }),
  } as MockFetchResponse) as unknown as typeof fetch;
}

function mockFetchCapture(payload: unknown): { body: Record<string, any> } {
  const capture: { body: Record<string, any> } = { body: {} };

  global.fetch = jest.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
    capture.body = JSON.parse(String(init?.body ?? '{}')) as Record<string, any>;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          content: JSON.stringify(payload),
        },
      }),
    } as MockFetchResponse;
  }) as unknown as typeof fetch;

  return capture;
}