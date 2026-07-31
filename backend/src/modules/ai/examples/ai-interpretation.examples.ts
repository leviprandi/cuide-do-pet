import { AIIntent } from "../types/ai-intent.enum";
import {
  AIInterpretationResult,
  EventCategory,
  ExpenseCategory,
  PetSpecies,
  ReminderType,
} from "../types/ai-interpretation-result.interface";

export const createEventExample: AIInterpretationResult = {
  intent: AIIntent.CREATE_EVENT,
  confidence: 0.97,
  entities: {
    petName: "Mia",
    eventType: "health",
    eventCategory: EventCategory.VOMIT,
    description: "vomitou hoje de manhã",
    eventDateText: "hoje de manhã",
  },
  derivedData: {
    eventDateIso: "2026-03-19T09:00:00",
  },
  requiresConfirmation: false,
  missingFields: [],
  assistantMessage: "Entendi um evento de vômito para Mia.",
};

export const registerExpenseExample: AIInterpretationResult = {
  intent: AIIntent.REGISTER_EXPENSE,
  confidence: 0.95,
  entities: {
    category: ExpenseCategory.FOOD,
    productName: "ração",
    targetSpecies: PetSpecies.DOG,
    price: 180,
    quantity: 15,
    unit: "kg",
    isShared: true,
    purchaseDateText: "hoje",
  },
  derivedData: {
    purchaseDateIso: "2026-03-19",
    unitPricePerKg: 12,
  },
  requiresConfirmation: false,
  missingFields: [],
  assistantMessage: "Identifiquei uma compra de ração para cães.",
};

export const openPackageExample: AIInterpretationResult = {
  intent: AIIntent.OPEN_PACKAGE,
  confidence: 0.91,
  entities: {
    category: ExpenseCategory.LITTER,
    productName: "areia",
    targetSpecies: PetSpecies.CAT,
    openDateText: "hoje",
  },
  derivedData: {
    openDateIso: "2026-03-19",
  },
  requiresConfirmation: true,
  missingFields: ["relatedExpenseId"],
  assistantMessage:
    "Entendi que você abriu uma nova areia hoje. Preciso identificar a compra relacionada.",
};

export const askHistoryExample: AIInterpretationResult = {
  intent: AIIntent.ASK_HISTORY_QUESTION,
  confidence: 0.93,
  entities: {
    petName: "Loki",
    questionType: "appetite",
    timeRangeText: "essa semana",
  },
  derivedData: {
    timeRangeStart: "2026-03-16",
    timeRangeEnd: "2026-03-19",
  },
  requiresConfirmation: false,
  missingFields: [],
  assistantMessage: "Vou analisar o histórico do Loki nesta semana.",
};

export const registerMedicationPlanExample: AIInterpretationResult = {
  intent: AIIntent.REGISTER_MEDICATION_PLAN,
  confidence: 0.92,
  entities: {
    petName: "Nix",
    anchorDatetimeText: "hoje às 8h",
    medications: [
      {
        name: null,
        dosage: null,
        scheduleRules: [
          {
            ruleType: "daily",
            timesPerDay: 1,
            durationDays: 3,
          },
          {
            ruleType: "one_time_after_days",
            afterDays: 15,
            doseCount: 1,
          },
        ],
      },
      {
        name: null,
        dosage: null,
        scheduleRules: [
          {
            ruleType: "every_x_hours",
            frequencyHours: 12,
            durationDays: 5,
          },
        ],
      },
    ],
  },
  derivedData: {
    anchorDatetimeIso: "2026-03-19T08:00:00",
  },
  requiresConfirmation: true,
  missingFields: ["medicationNames"],
  assistantMessage:
    "Entendi o cronograma de medicação do Nix, mas ainda preciso do nome dos remédios para salvar corretamente.",
};

export const generateVetSummaryExample: AIInterpretationResult = {
  intent: AIIntent.GENERATE_VET_SUMMARY,
  confidence: 0.98,
  entities: {
    petName: "Mia",
    timeRangeText: "últimos 10 dias",
  },
  derivedData: {
    timeRangeStart: "2026-03-09",
    timeRangeEnd: "2026-03-19",
  },
  requiresConfirmation: false,
  missingFields: [],
  assistantMessage:
    "Vou gerar um resumo veterinário dos últimos 10 dias da Mia.",
};

export const createReminderExample: AIInterpretationResult = {
  intent: AIIntent.CREATE_REMINDER,
  confidence: 0.96,
  entities: {
    petName: "Mia",
    reminderType: ReminderType.VET_RETURN,
    dueAtText: "daqui a 30 dias",
  },
  derivedData: {
    reminderDueAtIso: "2026-04-18T09:00:00",
  },
  requiresConfirmation: false,
  missingFields: [],
  assistantMessage:
    "Criei um lembrete de retorno veterinário para a Mia em 30 dias.",
};

export const aiInterpretationExamples = {
  createEventExample,
  registerExpenseExample,
  openPackageExample,
  askHistoryExample,
  registerMedicationPlanExample,
  generateVetSummaryExample,
  createReminderExample,
};