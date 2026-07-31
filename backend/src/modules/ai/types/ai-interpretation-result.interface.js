"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderType = exports.EventCategory = exports.ExpenseCategory = exports.PetSpecies = void 0;
var PetSpecies;
(function (PetSpecies) {
    PetSpecies["CAT"] = "cat";
    PetSpecies["DOG"] = "dog";
    PetSpecies["BIRD"] = "bird";
    PetSpecies["RABBIT"] = "rabbit";
    PetSpecies["REPTILE"] = "reptile";
    PetSpecies["OTHER"] = "other";
})(PetSpecies || (exports.PetSpecies = PetSpecies = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["FOOD"] = "food";
    ExpenseCategory["LITTER"] = "litter";
    ExpenseCategory["MEDICATION"] = "medication";
    ExpenseCategory["VET_VISIT"] = "vet_visit";
    ExpenseCategory["EXAM"] = "exam";
    ExpenseCategory["ACCESSORY"] = "accessory";
    ExpenseCategory["OTHER"] = "other";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var EventCategory;
(function (EventCategory) {
    EventCategory["VOMIT"] = "vomit";
    EventCategory["LOW_APPETITE"] = "low_appetite";
    EventCategory["LOW_WATER"] = "low_water";
    EventCategory["STOOL_CHANGE"] = "stool_change";
    EventCategory["VET_VISIT"] = "vet_visit";
    EventCategory["MEDICATION_START"] = "medication_start";
    EventCategory["FOOD_CHANGE"] = "food_change";
    EventCategory["PACKAGE_OPENED"] = "package_opened";
    EventCategory["NOTE"] = "note";
    EventCategory["OTHER"] = "other";
})(EventCategory || (exports.EventCategory = EventCategory = {}));
var ReminderType;
(function (ReminderType) {
    ReminderType["VET_RETURN"] = "vet_return";
    ReminderType["VACCINE_NEXT_DOSE"] = "vaccine_next_dose";
    ReminderType["MEDICATION_NEXT_DOSE"] = "medication_next_dose";
    ReminderType["EXAM_FOLLOWUP"] = "exam_followup";
    ReminderType["FOOD_RESTOCK"] = "food_restock";
    ReminderType["OTHER"] = "other";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
