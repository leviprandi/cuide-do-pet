"use client";

import { useEffect, useState } from "react";
import {
  getPets, createPet,
  getEvents, createEvent,
  getExpenses, createExpense,
  interpretMessage, handleMessage,
} from "../lib/api";
import type { Pet } from "../types/pet";
import type { Event } from "../types/event";
import type { Expense } from "../types/expense";
import type { AIContract } from "../types/ai-contract";
import { PetSection } from "../components/feature/PetSection";
import { EventSection } from "../components/feature/EventSection";
import { ExpenseSection } from "../components/feature/ExpenseSection";
import { AiTestSection } from "../components/feature/AiTestSection";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petBirthDate, setPetBirthDate] = useState("");
  const [petWeightKg, setPetWeightKg] = useState("");
  const [petNotes, setPetNotes] = useState("");
  const [petUserId, setPetUserId] = useState("");
  const [petCreateLoading, setPetCreateLoading] = useState(false);
  const [petCreateError, setPetCreateError] = useState<string | null>(null);
  const [petCreateSuccess, setPetCreateSuccess] = useState(false);

  const [eventPetId, setEventPetId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventOccurredAt, setEventOccurredAt] = useState("");
  const [eventCreateLoading, setEventCreateLoading] = useState(false);
  const [eventCreateError, setEventCreateError] = useState<string | null>(null);
  const [eventCreateSuccess, setEventCreateSuccess] = useState(false);

  const [expenseUserId, setExpenseUserId] = useState("");
  const [expenseItem, setExpenseItem] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseQuantity, setExpenseQuantity] = useState("");
  const [expenseUnit, setExpenseUnit] = useState("");
  const [expensePurchasedAt, setExpensePurchasedAt] = useState("");
  const [expenseCreateLoading, setExpenseCreateLoading] = useState(false);
  const [expenseCreateError, setExpenseCreateError] = useState<string | null>(null);
  const [expenseCreateSuccess, setExpenseCreateSuccess] = useState(false);

  const [aiMessage, setAiMessage] = useState("");
  const [aiInterpretLoading, setAiInterpretLoading] = useState(false);
  const [aiExecuteLoading, setAiExecuteLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIContract | null>(null);

  const [selectedPetId, setSelectedPetId] = useState("");

  async function refreshPets() {
    setPetsLoading(true);
    setPetsError(null);
    try {
      const data = await getPets();
      setPets(data);
    } catch (err) {
      setPetsError(err instanceof Error ? err.message : String(err));
    } finally {
      setPetsLoading(false);
    }
  }

  async function refreshEvents() {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : String(err));
    } finally {
      setEventsLoading(false);
    }
  }

  async function refreshExpenses() {
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : String(err));
    } finally {
      setExpensesLoading(false);
    }
  }

  useEffect(() => {
    refreshPets();
    refreshEvents();
    refreshExpenses();
  }, []);

  async function handleCreatePet() {
    setPetCreateLoading(true);
    setPetCreateError(null);
    setPetCreateSuccess(false);
    try {
      await createPet({
        name: petName,
        species: petSpecies,
        breed: petBreed,
        birthDate: petBirthDate,
        weightKg: parseFloat(petWeightKg),
        notes: petNotes || undefined,
        userId: petUserId,
      });
      setPetCreateSuccess(true);
      setPetName("");
      setPetSpecies("");
      setPetBreed("");
      setPetBirthDate("");
      setPetWeightKg("");
      setPetNotes("");
      setPetUserId("");
      await refreshPets();
    } catch (err) {
      setPetCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setPetCreateLoading(false);
    }
  }

  async function handleCreateEvent() {
    setEventCreateLoading(true);
    setEventCreateError(null);
    setEventCreateSuccess(false);
    try {
      await createEvent({
        petId: eventPetId,
        type: eventType,
        description: eventDescription,
        occurredAt: eventOccurredAt,
      });
      setEventCreateSuccess(true);
      setEventPetId("");
      setEventType("");
      setEventDescription("");
      setEventOccurredAt("");
      await refreshEvents();
    } catch (err) {
      setEventCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setEventCreateLoading(false);
    }
  }

  async function handleCreateExpense() {
    setExpenseCreateLoading(true);
    setExpenseCreateError(null);
    setExpenseCreateSuccess(false);
    try {
      await createExpense({
        userId: expenseUserId,
        item: expenseItem,
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        quantity: parseFloat(expenseQuantity),
        unit: expenseUnit,
        purchasedAt: expensePurchasedAt,
      });
      setExpenseCreateSuccess(true);
      setExpenseUserId("");
      setExpenseItem("");
      setExpenseCategory("");
      setExpenseAmount("");
      setExpenseQuantity("");
      setExpenseUnit("");
      setExpensePurchasedAt("");
      await refreshExpenses();
    } catch (err) {
      setExpenseCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setExpenseCreateLoading(false);
    }
  }

  async function handleInterpret() {
    setAiInterpretLoading(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const result = await interpretMessage(aiMessage);
      setAiResponse(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiInterpretLoading(false);
    }
  }

  async function handleExecute() {
    setAiExecuteLoading(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const result = await handleMessage(aiMessage);
      setAiResponse(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiExecuteLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          pets={pets}
          selectedPetId={selectedPetId}
          onSelectPet={setSelectedPetId}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div id="section-top" className="max-w-3xl mx-auto space-y-8">

            <div id="section-pets">
              <PetSection
                pets={pets}
                loading={petsLoading}
                error={petsError}
                name={petName}
                species={petSpecies}
                breed={petBreed}
                birthDate={petBirthDate}
                weightKg={petWeightKg}
                notes={petNotes}
                userId={petUserId}
                createLoading={petCreateLoading}
                createError={petCreateError}
                createSuccess={petCreateSuccess}
                onNameChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetName(v); }}
                onSpeciesChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetSpecies(v); }}
                onBreedChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetBreed(v); }}
                onBirthDateChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetBirthDate(v); }}
                onWeightKgChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetWeightKg(v); }}
                onNotesChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetNotes(v); }}
                onUserIdChange={(v) => { setPetCreateSuccess(false); setPetCreateError(null); setPetUserId(v); }}
                onSubmit={handleCreatePet}
              />
            </div>

            <div id="section-events">
              <EventSection
                events={events}
                loading={eventsLoading}
                error={eventsError}
                pets={pets}
                petId={eventPetId}
                type={eventType}
                description={eventDescription}
                occurredAt={eventOccurredAt}
                createLoading={eventCreateLoading}
                createError={eventCreateError}
                createSuccess={eventCreateSuccess}
                onPetIdChange={(v) => { setEventCreateSuccess(false); setEventCreateError(null); setEventPetId(v); }}
                onTypeChange={(v) => { setEventCreateSuccess(false); setEventCreateError(null); setEventType(v); }}
                onDescriptionChange={(v) => { setEventCreateSuccess(false); setEventCreateError(null); setEventDescription(v); }}
                onOccurredAtChange={(v) => { setEventCreateSuccess(false); setEventCreateError(null); setEventOccurredAt(v); }}
                onSubmit={handleCreateEvent}
              />
            </div>

            <div id="section-expenses">
              <ExpenseSection
                expenses={expenses}
                loading={expensesLoading}
                error={expensesError}
                userId={expenseUserId}
                item={expenseItem}
                category={expenseCategory}
                amount={expenseAmount}
                quantity={expenseQuantity}
                unit={expenseUnit}
                purchasedAt={expensePurchasedAt}
                createLoading={expenseCreateLoading}
                createError={expenseCreateError}
                createSuccess={expenseCreateSuccess}
                onUserIdChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseUserId(v); }}
                onItemChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseItem(v); }}
                onCategoryChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseCategory(v); }}
                onAmountChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseAmount(v); }}
                onQuantityChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseQuantity(v); }}
                onUnitChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpenseUnit(v); }}
                onPurchasedAtChange={(v) => { setExpenseCreateSuccess(false); setExpenseCreateError(null); setExpensePurchasedAt(v); }}
                onSubmit={handleCreateExpense}
              />
            </div>

            <div id="section-ai">
              <AiTestSection
                message={aiMessage}
                interpretLoading={aiInterpretLoading}
                executeLoading={aiExecuteLoading}
                error={aiError}
                response={aiResponse}
                onMessageChange={setAiMessage}
                onInterpret={handleInterpret}
                onExecute={handleExecute}
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}