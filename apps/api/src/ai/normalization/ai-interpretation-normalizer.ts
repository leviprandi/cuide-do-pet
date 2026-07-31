import { AiProviderResult } from '../providers/ai-provider.interface';
import { AiIntent } from '../types/ai-intent.enum';
import { normalizePtBrText, parsePtBrNumber } from './pt-br-number-parser';

export type RawInterpretation = {
  intent?: unknown;
  confidence?: unknown;
  entities?: unknown;
  missingFields?: unknown;
  requiresConfirmation?: unknown;
};

type EventEntities = {
  petName?: string;
  type?: string;
  description?: string;
  frequency?: number;
  relativeDate?: string;
  period?: string;
};

type ExpenseEntities = {
  petName?: string;
  item?: string;
  category?: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  relativeDate?: string;
  period?: string;
};

type ParsedDomainExpense = {
  item?: string;
  category?: string;
};

type ParsedQuantity = {
  quantity?: number;
  unit?: string;
};

export type ParsedTemporal = {
  relativeDate?: string;
  period?: string;
};

export type NormalizedAiInterpretationResult = AiProviderResult & {
  requiresConfirmation: boolean;
};

export type NormalizeAiInterpretationInput = {
  raw: RawInterpretation;
  includeParsedEntities: boolean;
  userMessage: string;
};

export function normalizeAiInterpretation(
  input: NormalizeAiInterpretationInput,
): NormalizedAiInterpretationResult {
  const { raw, includeParsedEntities, userMessage } = input;
  const intent = normalizeIntent(raw.intent);
  const confidence = normalizeConfidence(raw.confidence);

  if (intent === AiIntent.UNKNOWN) {
    return {
      intent: AiIntent.UNKNOWN,
      confidence,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    };
  }

  if (intent === AiIntent.CREATE_EVENT && isHistoricalQuestionMessage(userMessage)) {
    return {
      intent: AiIntent.UNKNOWN,
      confidence,
      entities: {},
      missingFields: [],
      requiresConfirmation: false,
    };
  }

  if (intent === AiIntent.CREATE_EVENT) {
    const entities = includeParsedEntities
      ? reconcileEventEntities(normalizeEventEntities(raw.entities), userMessage)
      : {};
    const missingFields = computeMissingFields(entities, ['type', 'description']);

    return {
      intent,
      confidence,
      entities,
      missingFields: ensureConfirmationMissingFields(missingFields, intent),
      requiresConfirmation: true,
    };
  }

  const entities = includeParsedEntities
    ? reconcileExpenseEntities(normalizeExpenseEntities(raw.entities), userMessage)
    : {};
  const missingFields = computeMissingFields(entities, ['item', 'amount', 'quantity', 'unit']);

  return {
    intent,
    confidence,
    entities,
    missingFields: ensureConfirmationMissingFields(missingFields, intent),
    requiresConfirmation: true,
  };
}

export function extractTemporalExpressions(message: string): ParsedTemporal {
  const normalized = normalizePtBrText(message);
  const parsed: ParsedTemporal = {};

  if (normalized.includes('hoje')) {
    parsed.relativeDate = 'hoje';
  } else if (normalized.includes('ontem')) {
    parsed.relativeDate = 'ontem';
  } else if (normalized.includes('amanha')) {
    parsed.relativeDate = 'amanha';
  }

  if (/(de|pela)\s+manha/.test(normalized)) {
    parsed.period = 'manha';
  } else if (/(a|de)\s+tarde/.test(normalized)) {
    parsed.period = 'tarde';
  } else if (/(a|de)\s+noite/.test(normalized)) {
    parsed.period = 'noite';
  }

  return parsed;
}

function normalizeIntent(rawIntent: unknown): AiIntent {
  if (typeof rawIntent !== 'string') {
    return AiIntent.UNKNOWN;
  }

  if (rawIntent === AiIntent.CREATE_EVENT) {
    return AiIntent.CREATE_EVENT;
  }

  if (rawIntent === AiIntent.REGISTER_EXPENSE) {
    return AiIntent.REGISTER_EXPENSE;
  }

  return AiIntent.UNKNOWN;
}

function normalizeConfidence(rawConfidence: unknown): number {
  if (typeof rawConfidence !== 'number' || !Number.isFinite(rawConfidence)) {
    return 0;
  }

  if (rawConfidence >= 0 && rawConfidence <= 1) {
    return rawConfidence;
  }

  if (rawConfidence > 1 && rawConfidence <= 100) {
    return rawConfidence / 100;
  }

  return 0;
}

function normalizeEventEntities(rawEntities: unknown): EventEntities {
  const entities = asObject(rawEntities);

  return {
    petName: asNonEmptyString(entities.petName),
    type: asUpperString(entities.type),
    description: asNonEmptyString(entities.description),
    frequency: asFlexibleNumber(entities.frequency),
    relativeDate: asNonEmptyString(entities.relativeDate),
    period: asNonEmptyString(entities.period),
  };
}

function normalizeExpenseEntities(rawEntities: unknown): ExpenseEntities {
  const entities = asObject(rawEntities);

  return {
    petName: asNonEmptyString(entities.petName),
    item: asNonEmptyString(entities.item),
    category: asLowerString(entities.category),
    amount: asFlexibleNumber(entities.amount),
    quantity: asFlexibleNumber(entities.quantity),
    unit: asLowerString(entities.unit),
  };
}

function computeMissingFields(entities: Record<string, unknown>, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => {
    const value = entities[field];
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim().length === 0;
    }

    if (typeof value === 'number') {
      return !Number.isFinite(value);
    }

    return true;
  });
}

function ensureConfirmationMissingFields(
  missingFields: string[],
  intent: AiIntent.CREATE_EVENT | AiIntent.REGISTER_EXPENSE,
): string[] {
  if (missingFields.length > 0) {
    return missingFields;
  }

  return [intent === AiIntent.CREATE_EVENT ? 'description' : 'item'];
}

function reconcileEventEntities(entities: EventEntities, userMessage: string): EventEntities {
  const reconciled: EventEntities = {
    ...entities,
  };

  if (!reconciled.description) {
    reconciled.description = userMessage;
  }

  const parsedTemporal = extractTemporalExpressions(userMessage);
  if (parsedTemporal.relativeDate) {
    reconciled.relativeDate = parsedTemporal.relativeDate;
  }
  if (parsedTemporal.period) {
    reconciled.period = parsedTemporal.period;
  }

  const explicitFrequency = extractExplicitFrequency(userMessage);
  if (explicitFrequency !== undefined) {
    reconciled.frequency = explicitFrequency;
  }

  if (isVagueEventMessage(userMessage)) {
    reconciled.description = userMessage;
    if (reconciled.type && isSpecificSymptomType(reconciled.type)) {
      reconciled.type = 'BEHAVIOR';
    }
  }

  return reconciled;
}

function reconcileExpenseEntities(entities: ExpenseEntities, userMessage: string): ExpenseEntities {
  const reconciled: ExpenseEntities = {
    ...entities,
  };

  const parsedTemporal = extractTemporalExpressions(userMessage);
  if (parsedTemporal.relativeDate) {
    reconciled.relativeDate = parsedTemporal.relativeDate;
  }
  if (parsedTemporal.period) {
    reconciled.period = parsedTemporal.period;
  }

  const parsedDomain = extractExpenseDomain(userMessage);
  if (parsedDomain.item) {
    reconciled.item = parsedDomain.item;
  }
  if (parsedDomain.category) {
    reconciled.category = parsedDomain.category;
  }

  const parsedQuantity = extractQuantityAndUnit(userMessage);
  if (parsedQuantity.quantity !== undefined) {
    reconciled.quantity = parsedQuantity.quantity;
  }
  if (parsedQuantity.unit) {
    reconciled.unit = parsedQuantity.unit;
  }

  const monetary = extractMonetaryAmount(userMessage);
  if (monetary.hasMonetaryContext) {
    if (monetary.amount !== undefined) {
      reconciled.amount = monetary.amount;
    }
  } else {
    delete reconciled.amount;
  }

  if (reconciled.amount !== undefined && reconciled.amount <= 0) {
    delete reconciled.amount;
  }

  if (reconciled.unit && isCurrencyUnit(reconciled.unit)) {
    delete reconciled.unit;
  }

  return reconciled;
}

function extractExplicitFrequency(message: string): number | undefined {
  const normalized = normalizePtBrText(message);

  const digitMatch = normalized.match(/(\d+)\s+vez(?:es)?\b/);
  if (digitMatch) {
    const parsed = Number(digitMatch[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  const wordMatch = normalized.match(
    /\b(uma|um|duas|dois|tres|quatro|cinco|seis|sete|oito|nove|dez)\b\s+vez(?:es)?\b/,
  );
  if (!wordMatch) {
    return undefined;
  }

  return parsePtBrNumber(wordMatch[1]);
}

function extractExpenseDomain(message: string): ParsedDomainExpense {
  const normalized = normalizePtBrText(message);

  if (normalized.includes('racao')) {
    return { item: 'racao', category: 'alimentacao' };
  }

  if (normalized.includes('remedio') || normalized.includes('medicamento')) {
    return { item: 'remedio', category: 'medicamento' };
  }

  if (normalized.includes('veterinario') || normalized.includes('veterinaria')) {
    return { item: 'consulta veterinaria', category: 'veterinaria' };
  }

  if (normalized.includes('consulta')) {
    return { item: 'consulta', category: 'veterinaria' };
  }

  return {};
}

function extractMonetaryAmount(message: string): { hasMonetaryContext: boolean; amount?: number } {
  const normalized = normalizePtBrText(message);
  const rawCurrencyMatch = message.match(
    /r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)/i,
  );
  if (rawCurrencyMatch) {
    return {
      hasMonetaryContext: true,
      amount: parseDecimalNumber(rawCurrencyMatch[1]),
    };
  }

  const hasMonetaryContext =
    normalized.includes('r$') ||
    /\breais?\b/.test(normalized) ||
    /\bcustou\b/.test(normalized) ||
    /\bpaguei\b/.test(normalized) ||
    /\bgastei\b/.test(normalized) ||
    /\bpor\s+[a-z0-9\s]+\s+reais?\b/.test(normalized);

  if (!hasMonetaryContext) {
    return { hasMonetaryContext: false };
  }

  const currencyMatch = normalized.match(/r\$\s*(\d+(?:[.,]\d+)?)/);
  if (currencyMatch) {
    return {
      hasMonetaryContext: true,
      amount: parseDecimalNumber(currencyMatch[1]),
    };
  }

  const verbNumericMatch = normalized.match(/\b(custou|paguei|gastei)\s+(\d+(?:[.,]\d+)?)/);
  if (verbNumericMatch) {
    return {
      hasMonetaryContext: true,
      amount: parseDecimalNumber(verbNumericMatch[2]),
    };
  }

  const numericRealMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*reais?\b/);
  if (numericRealMatch) {
    return {
      hasMonetaryContext: true,
      amount: parseDecimalNumber(numericRealMatch[1]),
    };
  }

  const byWordMatch = normalized.match(/\bpor\s+([a-z\s]+?)\s+reais?\b/);
  if (byWordMatch) {
    return {
      hasMonetaryContext: true,
      amount: parsePtBrNumber(byWordMatch[1].trim()),
    };
  }

  const wordsRealMatch = normalized.match(
    /\b([a-z\s]+?)\s+reais?\b(?:\s+para\b|\s+no\b|\s+na\b|\s+de\b|\s*$)/,
  );
  if (wordsRealMatch) {
    const amount = parsePtBrNumber(wordsRealMatch[1].trim());
    return {
      hasMonetaryContext: true,
      amount,
    };
  }

  return { hasMonetaryContext: true };
}

function extractQuantityAndUnit(message: string): ParsedQuantity {
  const normalized = normalizePtBrText(message);

  const halfKgMatch = normalized.match(/\bmeio\s+(kg|quilo|quilos)\b/);
  if (halfKgMatch) {
    return {
      quantity: 0.5,
      unit: 'kg',
    };
  }

  const numberAndHalfKgMatch = normalized.match(
    /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s+(kg|quilo|quilos)\s+e\s+meio\b/,
  );
  if (numberAndHalfKgMatch) {
    const integerPart = parsePtBrNumber(numberAndHalfKgMatch[1]);
    if (integerPart !== undefined) {
      return {
        quantity: integerPart + 0.5,
        unit: 'kg',
      };
    }
  }

  const regex =
    /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s+(kg|quilo|quilos|saco|sacos|unidade|unidades|unid)\b/;
  const match = normalized.match(regex);
  if (!match) {
    return {};
  }

  const quantity = parsePtBrNumber(match[1]);
  const unitRaw = match[2];

  let unit: string | undefined;
  if (unitRaw === 'quilo' || unitRaw === 'quilos' || unitRaw === 'kg') {
    unit = 'kg';
  } else if (unitRaw === 'unid' || unitRaw === 'unidade' || unitRaw === 'unidades') {
    unit = 'unidade';
  } else {
    unit = unitRaw;
  }

  return {
    quantity,
    unit,
  };
}

function parseDecimalNumber(value: string): number | undefined {
  const compact = value.trim().replace(/\s+/g, '');
  if (compact.length === 0) {
    return undefined;
  }

  let normalized = compact;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(compact)) {
    normalized = compact.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(compact)) {
    normalized = compact.replace(/,/g, '');
  } else {
    normalized = compact.replace(',', '.');
  }

  if (normalized.length === 0) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isCurrencyUnit(value: string): boolean {
  const normalized = normalizePtBrText(value);
  return normalized === 'real' || normalized === 'reais' || normalized === 'r$';
}

function isVagueEventMessage(message: string): boolean {
  const normalized = normalizePtBrText(message);
  return /\besta\s+estranho\b|\best[aá]\s+estranho\b/.test(normalized);
}

function isHistoricalQuestionMessage(message: string): boolean {
  const normalized = normalizePtBrText(message);
  const hasQuestionSignal = message.includes('?') || /\b(quando|qual)\b/.test(normalized);
  const hasHistoricalSignal = /\b(ultima|ultimo)\b/.test(normalized);
  const hasClinicalSubject = /\b(vacina|consulta)\b/.test(normalized);

  return hasQuestionSignal && hasHistoricalSignal && hasClinicalSubject;
}

function isSpecificSymptomType(type: string): boolean {
  const normalized = normalizePtBrText(type);
  return normalized === 'symptom' || normalized === 'sintoma';
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asUpperString(value: unknown): string | undefined {
  const normalized = asNonEmptyString(value);
  return normalized ? normalized.toUpperCase() : undefined;
}

function asLowerString(value: unknown): string | undefined {
  const normalized = asNonEmptyString(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function asFlexibleNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (normalized.length === 0) {
      return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
