import { AIIntent } from "./ai-intent.enum";

export type AIMissingField =
  | "petName"
  | "petNames"
  | "species"
  | "eventDate"
  | "price"
  | "quantity"
  | "unit"
  | "purchaseDate"
  | "relatedExpenseId"
  | "medicationName"
  | "medicationNames"
  | "anchorDatetime"
  | "dosage"
  | "scheduleRule"
  | "documentType"
  | "linkedEntity"
  | "timeRange";

export enum PetSpecies {
  CAT = "cat",
  DOG = "dog",
  BIRD = "bird",
  RABBIT = "rabbit",
  REPTILE = "reptile",
  OTHER = "other",
}

export enum ExpenseCategory {
  FOOD = "food",
  LITTER = "litter",
  MEDICATION = "medication",
  VET_VISIT = "vet_visit",
  EXAM = "exam",
  ACCESSORY = "accessory",
  OTHER = "other",
}

export enum EventCategory {
  VOMIT = "vomit",
  LOW_APPETITE = "low_appetite",
  LOW_WATER = "low_water",
  STOOL_CHANGE = "stool_change",
  VET_VISIT = "vet_visit",
  MEDICATION_START = "medication_start",
  FOOD_CHANGE = "food_change",
  PACKAGE_OPENED = "package_opened",
  NOTE = "note",
  OTHER = "other",
}

export enum ReminderType {
  VET_RETURN = "vet_return",
  VACCINE_NEXT_DOSE = "vaccine_next_dose",
  MEDICATION_NEXT_DOSE = "medication_next_dose",
  EXAM_FOLLOWUP = "exam_followup",
  FOOD_RESTOCK = "food_restock",
  OTHER = "other",
}

export type MedicationRuleType =
  | "daily"
  | "every_x_hours"
  | "one_time"
  | "one_time_after_days";

export interface AIMedicationScheduleRule {
  ruleType: MedicationRuleType;
  timesPerDay?: number | null;
  frequencyHours?: number | null;
  durationDays?: number | null;
  afterDays?: number | null;
  doseCount?: number | null;
}

export interface AIMedicationInput {
  name?: string | null;
  dosage?: string | null;
  instructions?: string | null;
  scheduleRules: AIMedicationScheduleRule[];
}

export interface AIMedicationDosePreview {
  medicationName?: string | null;
  scheduledAt: string;
  phaseLabel?: string | null;
}

export interface AIEntities {
  petName?: string | null;
  petNames?: string[];
  species?: PetSpecies | null;

  eventType?: string | null;
  eventCategory?: EventCategory | null;
  description?: string | null;
  eventDateText?: string | null;

  category?: ExpenseCategory | null;
  productName?: string | null;
  brand?: string | null;
  targetSpecies?: PetSpecies | null;
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  isShared?: boolean | null;
  purchaseDateText?: string | null;
  openDateText?: string | null;

  questionType?: string | null;
  timeRangeText?: string | null;

  medicationName?: string | null;
  medicationNames?: string[];
  dosage?: string | null;
  anchorDatetimeText?: string | null;
  medications?: AIMedicationInput[];

  documentType?: string | null;

  reminderType?: ReminderType | null;
  dueAtText?: string | null;
}

export interface AIDerivedData {
  eventDateIso?: string | null;
  purchaseDateIso?: string | null;
  openDateIso?: string | null;

  timeRangeStart?: string | null;
  timeRangeEnd?: string | null;

  unitPricePerKg?: number | null;

  anchorDatetimeIso?: string | null;

  suggestedPetIds?: string[];
  suggestedExpenseId?: string | null;

  medicationSchedulePreview?: AIMedicationDosePreview[];

  reminderDueAtIso?: string | null;
}

export interface AIInterpretationResult {
  intent: AIIntent;
  confidence: number;
  entities: AIEntities;
  derivedData: AIDerivedData;
  requiresConfirmation: boolean;
  missingFields: AIMissingField[];
  assistantMessage: string;
}