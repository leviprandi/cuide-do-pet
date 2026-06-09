import { AiIntent } from '../types/ai-intent.enum';

export interface AiProviderInput {
  userMessage: string;
  includeParsedEntities?: boolean;
}

export interface AiProviderResult {
  intent: AiIntent;
  confidence: number;
  entities: Record<string, unknown>;
  missingFields: string[];
}

export interface AiProvider {
  interpret(input: AiProviderInput): Promise<AiProviderResult>;
}

export const AI_PROVIDER = 'AI_PROVIDER';