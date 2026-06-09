import { BadRequestException, Injectable } from '@nestjs/common';
import { AiIntent } from '../types/ai-intent.enum';
import { AiProvider, AiProviderInput, AiProviderResult } from './ai-provider.interface';

@Injectable()
export class DeterministicAiProvider implements AiProvider {
  async interpret(input: AiProviderInput): Promise<AiProviderResult> {
    const normalizedMessage = input.userMessage?.trim().toLowerCase();

    if (!normalizedMessage) {
      throw new BadRequestException('userMessage is required for AI interpretation');
    }

    if (this.isCreateEventIntent(normalizedMessage)) {
      const entities = input.includeParsedEntities
        ? this.parseEventMessage(input.userMessage)
        : {};

      return {
        intent: AiIntent.CREATE_EVENT,
        confidence: 0.7,
        entities,
        missingFields: input.includeParsedEntities
          ? this.findMissingFields(entities, ['petId', 'type', 'description', 'occurredAt'])
          : ['petId', 'type', 'description', 'occurredAt'],
      };
    }

    if (this.isRegisterExpenseIntent(normalizedMessage)) {
      const entities = input.includeParsedEntities
        ? this.parseExpenseMessage(input.userMessage)
        : {};

      return {
        intent: AiIntent.REGISTER_EXPENSE,
        confidence: 0.7,
        entities,
        missingFields: input.includeParsedEntities
          ? this.findMissingFields(entities, [
              'userId',
              'item',
              'category',
              'amount',
              'purchasedAt',
            ])
          : ['userId', 'item', 'category', 'amount', 'purchasedAt'],
      };
    }

    return {
      intent: AiIntent.UNKNOWN,
      confidence: 0.3,
      entities: {},
      missingFields: [],
    };
  }

  private isCreateEventIntent(message: string): boolean {
    return message.includes('event') || message.includes('consulta') || message.includes('vacina');
  }

  private isRegisterExpenseIntent(message: string): boolean {
    return message.includes('expense') || message.includes('gasto') || message.includes('compra');
  }

  private parseEventMessage(message: string): {
    petId?: string;
    type?: string;
    description?: string;
    occurredAt?: string;
  } {
    if (!/^\s*event\b/i.test(message)) {
      return {};
    }

    const entities = this.extractKeyValuePairs(message);

    return {
      petId: entities.petId,
      type: entities.type ? entities.type.toUpperCase() : undefined,
      description: entities.description,
      occurredAt: entities.occurredAt,
    };
  }

  private parseExpenseMessage(message: string): {
    userId?: string;
    item?: string;
    category?: string;
    amount?: number;
    purchasedAt?: string;
    quantity?: number;
    unit?: string;
  } {
    if (!/^\s*expense\b/i.test(message)) {
      return {};
    }

    const entities = this.extractKeyValuePairs(message);

    return {
      userId: entities.userId,
      item: entities.item,
      category: entities.category,
      amount: this.parseOptionalNumber(entities.amount, 'amount'),
      purchasedAt: entities.purchasedAt,
      quantity: this.parseOptionalNumber(entities.quantity, 'quantity'),
      unit: entities.unit,
    };
  }

  private extractKeyValuePairs(message: string): Record<string, string> {
    const result: Record<string, string> = {};
    const regex = /(\w+)\s*=\s*(("[^"]*")|('[^']*')|[^\s]+)/g;

    for (const match of message.matchAll(regex)) {
      const key = match[1];
      const rawValue = match[2];
      result[key] = this.normalizeValue(rawValue);
    }

    return result;
  }

  private normalizeValue(value: string): string {
    const trimmed = value.trim();

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    return trimmed;
  }

  private parseOptionalNumber(
    value: string | undefined,
    fieldName: 'amount' | 'quantity',
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`Invalid ${fieldName} format. Expected numeric value.`);
    }

    return parsed;
  }

  private findMissingFields(
    entities: Record<string, unknown>,
    requiredFields: string[],
  ): string[] {
    return requiredFields.filter((field) => {
      const value = entities[field];
      if (value === undefined || value === null) {
        return true;
      }

      if (typeof value === 'string') {
        return value.trim() === '';
      }

      return false;
    });
  }
}