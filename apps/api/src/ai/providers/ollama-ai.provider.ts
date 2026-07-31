import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  normalizeAiInterpretation,
  RawInterpretation,
} from '../normalization/ai-interpretation-normalizer';
import { AiIntent } from '../types/ai-intent.enum';
import { AiProvider, AiProviderInput, AiProviderResult } from './ai-provider.interface';

type OllamaMessageResponse = {
  message?: {
    content?: unknown;
  };
};

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen3.5:9b';
const DEFAULT_TIMEOUT_MS = 10000;

const SYSTEM_PROMPT = [
  'You are an intent parser for a pet care assistant.',
  'Classify using only these intents: CREATE_EVENT, REGISTER_EXPENSE, UNKNOWN.',
  'Rules:',
  '- symptom, vomit, behavior, feeding, medication, vaccine, checkup, weight change, or incident about the pet => CREATE_EVENT.',
  '- spending, purchase, payment, price, cost, or monetary value => REGISTER_EXPENSE.',
  '- greeting or message without event/expense => UNKNOWN.',
  '- a symptom without monetary value must NEVER be UNKNOWN nor REGISTER_EXPENSE.',
  '- expense mapping: amount is only money value; quantity is amount bought; unit is quantity unit like kg and never currency; item is product name like racao; preserve petName when mentioned.',
  '- do not invent IDs, UUIDs, dates, or times.',
  '- confidence must be decimal between 0 and 1.',
  '- respond only with valid JSON that matches the provided schema.',
  '- for symptom events, set type to SYMPTOM when no explicit event type is present.',
  '- when text says the pet name (for example Thor), copy it to petName exactly.',
  '- when text says "vomitou duas vezes" or equivalent, set frequency to 2.',
  '- if a money amount and purchase quantity appear together, extract both: amount is money only, quantity is bought amount, unit is measurement unit.',
  '- if quantity is described as quilos or kg, unit must be kg.',
  '- if racao or ração is mentioned in purchase text, item is REQUIRED and must include racao.',
  '- never leave item empty when a purchasable product is mentioned.',
  '- example output for "Gastei 189 reais em 15 quilos de ração para o Thor": {"intent":"REGISTER_EXPENSE","confidence":0.95,"entities":{"petName":"Thor","item":"racao","amount":189,"quantity":15,"unit":"kg"},"missingFields":[],"requiresConfirmation":true}',
  '- for sentence "Gastei 189 reais em 15 quilos de racao para o Thor", output intent REGISTER_EXPENSE with petName Thor, amount 189, quantity 15, unit kg, item containing racao.',
  '- for sentence "Hoje o Thor vomitou duas vezes de manha", output intent CREATE_EVENT with petName Thor and frequency 2.',
  'sintoma -> CREATE_EVENT',
].join('\n');

const OLLAMA_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    intent: {
      type: 'string',
      enum: [AiIntent.CREATE_EVENT, AiIntent.REGISTER_EXPENSE, AiIntent.UNKNOWN],
    },
    confidence: { type: 'number' },
    entities: {
      type: 'object',
      additionalProperties: false,
      properties: {
        petName: { type: 'string' },
        type: { type: 'string' },
        description: { type: 'string' },
        frequency: { type: 'number' },
        relativeDate: { type: 'string' },
        period: { type: 'string' },
        item: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
      },
    },
    missingFields: {
      type: 'array',
      items: { type: 'string' },
    },
    requiresConfirmation: { type: 'boolean' },
  },
  required: ['intent', 'confidence', 'entities', 'missingFields', 'requiresConfirmation'],
};

@Injectable()
export class OllamaAiProvider implements AiProvider {
  async interpret(input: AiProviderInput): Promise<AiProviderResult> {
    const userMessage = input.userMessage?.trim();
    if (!userMessage) {
      throw new BadRequestException('userMessage is required for AI interpretation');
    }

    const baseUrl = this.getBaseUrl();
    const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
    const timeoutMs = this.getTimeoutMs();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          think: false,
          format: OLLAMA_RESPONSE_SCHEMA,
          options: {
            temperature: 0,
          },
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('Ollama request timed out');
      }

      if (error instanceof TypeError) {
        throw new ServiceUnavailableException('Failed to connect to Ollama');
      }

      throw new BadGatewayException('Failed to call Ollama API');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new BadGatewayException(`Ollama API returned HTTP ${response.status}`);
    }

    let body: OllamaMessageResponse;
    try {
      body = (await response.json()) as OllamaMessageResponse;
    } catch {
      throw new BadGatewayException('Ollama API returned invalid JSON response');
    }

    if (!body.message || typeof body.message.content !== 'string') {
      throw new BadGatewayException('Ollama response did not include message.content');
    }

    let parsed: RawInterpretation;
    try {
      parsed = JSON.parse(body.message.content) as RawInterpretation;
    } catch {
      throw new BadGatewayException('Ollama message.content is not valid JSON');
    }

    return normalizeAiInterpretation({
      raw: parsed,
      includeParsedEntities: Boolean(input.includeParsedEntities),
      userMessage,
    });
  }

  private getBaseUrl(): string {
    const configuredBaseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  private getTimeoutMs(): number {
    const rawTimeout = process.env.OLLAMA_TIMEOUT_MS;
    if (!rawTimeout) {
      return DEFAULT_TIMEOUT_MS;
    }

    const parsed = Number(rawTimeout);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_TIMEOUT_MS;
    }

    return parsed;
  }

}