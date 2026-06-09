import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AiController } from '../src/ai/ai.controller';
import { DeterministicAiProvider } from '../src/ai/providers/deterministic-ai.provider';
import { AI_PROVIDER } from '../src/ai/providers/ai-provider.interface';
import { AiService } from '../src/ai/ai.service';
import { EventsService } from '../src/events/events.service';
import { ExpensesService } from '../src/expenses/expenses.service';

describe('AI deterministic contract (e2e)', () => {
  let app: INestApplication<App>;

  const eventsServiceMock = {
    create: jest.fn(),
  };

  const expensesServiceMock = {
    create: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        DeterministicAiProvider,
        {
          provide: AI_PROVIDER,
          useExisting: DeterministicAiProvider,
        },
        {
          provide: EventsService,
          useValue: eventsServiceMock,
        },
        {
          provide: ExpensesService,
          useValue: expensesServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    eventsServiceMock.create.mockReset();
    expensesServiceMock.create.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /ai/interpret returns CREATE_EVENT contract keys', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/interpret')
      .send({ message: 'create event for vaccine' })
      .expect(201);

    expect(response.body).toMatchObject({
      intent: 'CREATE_EVENT',
      requiresConfirmation: true,
      executed: false,
      createdRecord: null,
      executionType: 'confirmation_required',
    });
    expect(Array.isArray(response.body.missingFields)).toBe(true);
  });

  it('POST /ai/interpret rejects empty message with 400', async () => {
    await request(app.getHttpServer())
      .post('/ai/interpret')
      .send({ message: '' })
      .expect(400);
  });

  it('POST /ai/handle executes event creation successfully', async () => {
    eventsServiceMock.create.mockResolvedValue({
      id: 'event-1',
      petId: '8d2edf6a-e387-4b14-be52-c9ffe9111190',
      type: 'VACCINE',
      description: 'Rabies vaccine applied',
      occurredAt: '2026-03-29T18:30:00.000Z',
    });

    const message =
      'event petId=8d2edf6a-e387-4b14-be52-c9ffe9111190 type=VACCINE description="Rabies vaccine applied" occurredAt=2026-03-29T18:30:00.000Z';

    const response = await request(app.getHttpServer())
      .post('/ai/handle')
      .send({ message })
      .expect(201);

    expect(eventsServiceMock.create).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      intent: 'CREATE_EVENT',
      requiresConfirmation: false,
      executed: true,
      executionType: 'created',
    });
    expect(response.body.createdRecord).toBeTruthy();
  });

  it('POST /ai/handle executes expense creation successfully', async () => {
    expensesServiceMock.create.mockResolvedValue({
      id: 'expense-1',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      item: 'Royal Canin Adult',
      category: 'food',
      amount: 189.9,
      purchasedAt: '2026-03-30T18:00:00.000Z',
      quantity: 15,
      unit: 'kg',
      pricePerKg: 12.66,
    });

    const message =
      'expense userId=550e8400-e29b-41d4-a716-446655440000 item="Royal Canin Adult" category=food amount=189.90 purchasedAt=2026-03-30T18:00:00.000Z quantity=15 unit=kg';

    const response = await request(app.getHttpServer())
      .post('/ai/handle')
      .send({ message })
      .expect(201);

    expect(expensesServiceMock.create).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      intent: 'REGISTER_EXPENSE',
      requiresConfirmation: false,
      executed: true,
      executionType: 'created',
    });
    expect(response.body.createdRecord).toBeTruthy();
  });

  it('POST /ai/handle returns confirmation-required and persists nothing for incomplete event', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/handle')
      .send({
        message: 'event petId=8d2edf6a-e387-4b14-be52-c9ffe9111190 type=VACCINE',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      intent: 'CREATE_EVENT',
      requiresConfirmation: true,
      missingFields: ['description', 'occurredAt'],
      executed: false,
      createdRecord: null,
      executionType: 'confirmation_required',
    });
    expect(eventsServiceMock.create).not.toHaveBeenCalled();
    expect(expensesServiceMock.create).not.toHaveBeenCalled();
  });

  it('POST /ai/handle returns unsupported for unknown input and persists nothing', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/handle')
      .send({ message: 'hello there' })
      .expect(201);

    expect(response.body).toMatchObject({
      intent: 'UNKNOWN',
      requiresConfirmation: true,
      executed: false,
      createdRecord: null,
      executionType: 'unsupported',
    });
    expect(eventsServiceMock.create).not.toHaveBeenCalled();
    expect(expensesServiceMock.create).not.toHaveBeenCalled();
  });
});
