import { AiIntent } from './ai-intent.enum';

export type AiExecutionType = 'created' | 'confirmation_required' | 'unsupported';

export interface AiInterpretationResult {
  intent: AiIntent;
  confidence: number;
  entities: Record<string, unknown>;
  requiresConfirmation: boolean;
  missingFields: string[];
  assistantMessage: string;
  executed: boolean;
  createdRecord: unknown | null;
  executionType: AiExecutionType;
}