import type { AIContract } from "../types/ai-contract";
import type { Event } from "../types/event";
import type { Expense } from "../types/expense";
import type { Pet } from "../types/pet";

const API_BASE_URL = "http://localhost:3001";

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${endpoint}) - HTTP ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getPets(): Promise<Pet[]> {
  return fetchApi<Pet[]>("/pets");
}

export async function createPet(data: {
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weightKg: number;
  notes?: string;
  userId: string;
}): Promise<Pet> {
  return fetchApi<Pet>("/pets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getEvents(): Promise<Event[]> {
  return fetchApi<Event[]>("/events");
}

export async function createEvent(data: {
  petId: string;
  type: string;
  description: string;
  occurredAt: string;
}): Promise<Event> {
  return fetchApi<Event>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getExpenses(): Promise<Expense[]> {
  return fetchApi<Expense[]>("/expenses");
}

export async function createExpense(data: {
  userId: string;
  item: string;
  category: string;
  amount: number;
  quantity: number;
  unit: string;
  purchasedAt: string;
}): Promise<Expense> {
  return fetchApi<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function interpretMessage(message: string): Promise<AIContract> {
  return fetchApi<AIContract>("/ai/interpret", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function handleMessage(message: string): Promise<AIContract> {
  return fetchApi<AIContract>("/ai/handle", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
