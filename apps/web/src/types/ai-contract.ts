export interface AIContract {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  requiresConfirmation: boolean;
  missingFields: string[];
  assistantMessage: string;
  executed: boolean;
  createdRecord: unknown;
  executionType: "created" | "confirmation_required" | "unsupported";
}
