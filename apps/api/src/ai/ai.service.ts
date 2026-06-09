import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { ExpensesService } from '../expenses/expenses.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type { AiProvider } from './providers/ai-provider.interface';
import { AiIntent } from './types/ai-intent.enum';
import { AiInterpretationResult } from './types/ai-interpretation-result.interface';

type EventEntities = {
  petId?: string;
  type?: string;
  description?: string;
  occurredAt?: string;
};

type ExpenseEntities = {
  userId?: string;
  item?: string;
  category?: string;
  amount?: number;
  purchasedAt?: string;
  quantity?: number;
  unit?: string;
};

@Injectable()
export class AiService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly expensesService: ExpensesService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
  ) {}

  async interpret(userMessage: string): Promise<AiInterpretationResult> {
    const interpretation = await this.aiProvider.interpret({ userMessage });

    if (interpretation.intent === AiIntent.CREATE_EVENT) {
      return {
        intent: AiIntent.CREATE_EVENT,
        confidence: interpretation.confidence,
        entities: {},
        requiresConfirmation: true,
        missingFields: ['petId', 'type', 'description', 'occurredAt'],
        assistantMessage:
          'I understood this as CREATE_EVENT. Please confirm the required event details.',
        executed: false,
        createdRecord: null,
        executionType: 'confirmation_required',
      };
    }

    if (interpretation.intent === AiIntent.REGISTER_EXPENSE) {
      return {
        intent: AiIntent.REGISTER_EXPENSE,
        confidence: interpretation.confidence,
        entities: {},
        requiresConfirmation: true,
        missingFields: ['userId', 'item', 'category', 'amount', 'purchasedAt'],
        assistantMessage:
          'I understood this as REGISTER_EXPENSE. Please confirm the required expense details.',
        executed: false,
        createdRecord: null,
        executionType: 'confirmation_required',
      };
    }

    return {
      intent: AiIntent.UNKNOWN,
      confidence: interpretation.confidence,
      entities: {},
      requiresConfirmation: true,
      missingFields: [],
      assistantMessage:
        'I could not determine a supported intent. Please clarify if you want to create an event or register an expense.',
      executed: false,
      createdRecord: null,
      executionType: 'unsupported',
    };
  }

  async handle(userMessage: string): Promise<AiInterpretationResult> {
    const interpretation = await this.aiProvider.interpret({
      userMessage,
      includeParsedEntities: true,
    });

    if (interpretation.intent === AiIntent.UNKNOWN) {
      return this.buildHandleResponse({
        intent: interpretation.intent,
        confidence: interpretation.confidence,
        entities: {},
        requiresConfirmation: true,
        missingFields: [],
        assistantMessage:
          'Detected intent: UNKNOWN. Supported formats: event ... or expense ...',
        executed: false,
        createdRecord: null,
        executionType: 'unsupported',
      });
    }

    if (interpretation.intent === AiIntent.CREATE_EVENT) {
      const entities = interpretation.entities as EventEntities;
      const missingFields = interpretation.missingFields;

      if (missingFields.length > 0) {
        return this.buildHandleResponse({
          intent: interpretation.intent,
          confidence: interpretation.confidence,
          entities,
          requiresConfirmation: true,
          missingFields,
          assistantMessage: this.buildMissingFieldsMessage(
            interpretation.intent,
            missingFields,
          ),
          executed: false,
          createdRecord: null,
          executionType: 'confirmation_required',
        });
      }

      const petId = entities.petId;
      if (!petId || !this.isUuid(petId)) {
        throw new BadRequestException('Invalid petId format. Expected UUID.');
      }

      const type = entities.type!;
      const description = entities.description!;
      const occurredAt = entities.occurredAt!;

      const createdRecord = await this.eventsService.create({
        petId,
        type,
        description,
        occurredAt,
      });

      return this.buildHandleResponse({
        intent: interpretation.intent,
        confidence: interpretation.confidence,
        entities,
        requiresConfirmation: false,
        missingFields: [],
        assistantMessage: 'Event created successfully.',
        executed: true,
        createdRecord,
        executionType: 'created',
      });
    }

    const entities = interpretation.entities as ExpenseEntities;
    const missingFields = interpretation.missingFields;

    if (missingFields.length > 0) {
      return this.buildHandleResponse({
        intent: interpretation.intent,
        confidence: interpretation.confidence,
        entities,
        requiresConfirmation: true,
        missingFields,
        assistantMessage: this.buildMissingFieldsMessage(
          interpretation.intent,
          missingFields,
        ),
        executed: false,
        createdRecord: null,
        executionType: 'confirmation_required',
      });
    }

    const userId = entities.userId;
    if (!userId || !this.isUuid(userId)) {
      throw new BadRequestException('Invalid userId format. Expected UUID.');
    }

    const item = entities.item!;
    const category = entities.category!;
    const amount = entities.amount!;
    const purchasedAt = entities.purchasedAt!;

    const createdRecord = await this.expensesService.create({
      userId,
      item,
      category,
      amount,
      purchasedAt,
      quantity: entities.quantity,
      unit: entities.unit,
    });

    return this.buildHandleResponse({
      intent: interpretation.intent,
      confidence: interpretation.confidence,
      entities,
      requiresConfirmation: false,
      missingFields: [],
      assistantMessage: 'Expense created successfully.',
      executed: true,
      createdRecord,
      executionType: 'created',
    });
  }

  private buildMissingFieldsMessage(intent: AiIntent, missingFields: string[]): string {
    return `Detected intent: ${intent}. Missing fields: ${missingFields.join(', ')}`;
  }

  private buildHandleResponse(response: AiInterpretationResult): AiInterpretationResult {
    return response;
  }

  private isUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}