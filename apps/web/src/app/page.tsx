"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createExpense,
  createPet,
  getEvents,
  getExpenses,
  getPets,
  handleMessage,
} from "../lib/api";
import type { Event } from "../types/event";
import type { Expense } from "../types/expense";
import type { AIContract } from "../types/ai-contract";
import type { Pet } from "../types/pet";

type ViewMode = "login" | "dashboard" | "detail" | "add-pet" | "expenses";
type AnimalType = "cat" | "dog" | "bird" | "other";

type ChatAction = {
  label: string;
  kind: "open-expenses" | "back-dashboard";
};

type ChatMessage = {
  id: number;
  from: "user" | "bot";
  text: string;
  actions: ChatAction[];
};

type PetHealth = {
  kind: "alert" | "warn" | "ok";
  text: string;
};

type PetCard = {
  pet: Pet;
  type: AnimalType;
  health: PetHealth;
  trendText: string;
  trendColor: string;
  ageLabel: string;
  emoji: string;
  rotation: string;
  accent: string;
};

type ExpenseCategoryFilter = "all" | "food" | "health" | "hygiene" | "other";

const ROTATIONS = ["-1.2deg", "0.9deg", "-0.5deg", "1.1deg", "-0.8deg", "0.6deg"];

function speciesToType(species: string): AnimalType {
  const s = species.toLowerCase();
  if (s.includes("cat") || s.includes("gato")) return "cat";
  if (s.includes("dog") || s.includes("cao") || s.includes("cão") || s.includes("cachorro")) return "dog";
  if (s.includes("bird") || s.includes("ave") || s.includes("passaro") || s.includes("pássaro")) return "bird";
  return "other";
}

function typeEmoji(type: AnimalType): string {
  if (type === "cat") return "🐱";
  if (type === "dog") return "🐶";
  if (type === "bird") return "🐦";
  return "🐾";
}

function typeLabel(type: AnimalType): string {
  if (type === "cat") return "Gatos";
  if (type === "dog") return "Cães";
  if (type === "bird") return "Aves";
  return "Outros";
}

function calcAgeLabel(birthDate: string): string {
  const dt = new Date(birthDate);
  if (Number.isNaN(dt.getTime())) return "idade não informada";
  const now = new Date();
  const years = now.getFullYear() - dt.getFullYear();
  if (years <= 0) return "menos de 1 ano";
  return years === 1 ? "1 ano" : `${years} anos`;
}

function isRecent(dateIso: string, days: number): boolean {
  const dt = new Date(dateIso);
  if (Number.isNaN(dt.getTime())) return false;
  const diff = Date.now() - dt.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function evaluatePetHealth(petEvents: Event[]): PetHealth {
  if (petEvents.length === 0) {
    return { kind: "ok", text: "● Tudo em dia" };
  }

  const recentConcern = petEvents.find((ev) => {
    const raw = `${ev.type} ${ev.description}`.toLowerCase();
    return isRecent(ev.occurredAt, 14) && /(vomit|vômit|diarr|ferid|sang|triste|apat|urg)/.test(raw);
  });
  if (recentConcern) {
    return { kind: "alert", text: "⚠ Evento de saúde recente" };
  }

  const hasReminder = petEvents.find((ev) => {
    const raw = `${ev.type} ${ev.description}`.toLowerCase();
    return /(vacin|consulta|vet|vermif|vermíf)/.test(raw);
  });
  if (hasReminder) {
    return { kind: "warn", text: "◷ Lembrete de cuidado" };
  }

  return { kind: "ok", text: "● Tudo em dia" };
}

function healthColors(kind: PetHealth["kind"]): {
  bg: string;
  color: string;
  pin: string;
  dot: string;
} {
  if (kind === "alert") {
    return {
      bg: "#fbe7e1",
      color: "#c25448",
      pin: "radial-gradient(circle at 35% 30%,#f3a89f,#d8584b 72%)",
      dot: "#e58b7e",
    };
  }
  if (kind === "warn") {
    return {
      bg: "#fbeecd",
      color: "#a07e2a",
      pin: "radial-gradient(circle at 35% 30%,#f7e6a8,#d9b657 72%)",
      dot: "#f0d488",
    };
  }
  return {
    bg: "#dcefe2",
    color: "#3f7d59",
    pin: "radial-gradient(circle at 35% 30%,#a9d6bb,#5c9e78 72%)",
    dot: "#7bbf95",
  };
}

function pickAccent(index: number): string {
  const accents = [
    "repeating-linear-gradient(45deg,#f0d9c4,#f0d9c4 5px,#e6c9ad 5px,#e6c9ad 10px)",
    "repeating-linear-gradient(45deg,#d6e0ea,#d6e0ea 5px,#c2cfdd 5px,#c2cfdd 10px)",
    "repeating-linear-gradient(45deg,#e7dcc6,#e7dcc6 5px,#dccfb0 5px,#dccfb0 10px)",
    "repeating-linear-gradient(45deg,#dfe7d1,#dfe7d1 5px,#ccd8b8 5px,#ccd8b8 10px)",
  ];
  return accents[index % accents.length];
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export default function Home() {
  const [view, setView] = useState<ViewMode>("login");
  const [activeType, setActiveType] = useState<AnimalType>("cat");
  const [selectedPetId, setSelectedPetId] = useState<string>("");

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
  const [petSpecies, setPetSpecies] = useState("gato");
  const [petBreed, setPetBreed] = useState("");
  const [petBirthDate, setPetBirthDate] = useState("");
  const [petWeightKg, setPetWeightKg] = useState("");
  const [petNotes, setPetNotes] = useState("");
  const [petUserId, setPetUserId] = useState("");
  const [petCreateLoading, setPetCreateLoading] = useState(false);
  const [petCreateError, setPetCreateError] = useState<string | null>(null);
  const [petCreateSuccess, setPetCreateSuccess] = useState<string | null>(null);

  const [expenseFilter, setExpenseFilter] = useState<ExpenseCategoryFilter>("all");
  const [expenseUserId, setExpenseUserId] = useState("");
  const [expenseItem, setExpenseItem] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("other");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseQuantity, setExpenseQuantity] = useState("1");
  const [expenseUnit, setExpenseUnit] = useState("unit");
  const [expensePurchasedAt, setExpensePurchasedAt] = useState("");
  const [expenseCreateLoading, setExpenseCreateLoading] = useState(false);
  const [expenseCreateError, setExpenseCreateError] = useState<string | null>(null);
  const [expenseCreateSuccess, setExpenseCreateSuccess] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatResponse, setChatResponse] = useState<AIContract | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "bot",
      text: "Oi! Eu registro eventos e gastos dos seus pets. Conte o que aconteceu em linguagem natural.",
      actions: [],
    },
  ]);

  const [msgId, setMsgId] = useState(2);

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

  useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }

    if (!petUserId && pets.length > 0) {
      setPetUserId(pets[0].userId);
    }

    if (!expenseUserId && pets.length > 0) {
      setExpenseUserId(pets[0].userId);
    }
  }, [pets, selectedPetId, petUserId, expenseUserId]);

  async function handleCreatePet() {
    if (
      !petName.trim() ||
      !petSpecies.trim() ||
      !petBreed.trim() ||
      !petBirthDate.trim() ||
      Number.isNaN(Date.parse(petBirthDate)) ||
      !petWeightKg.trim() ||
      Number.isNaN(Number.parseFloat(petWeightKg)) ||
      !petUserId.trim()
    ) {
      setPetCreateError("Preencha os campos obrigatórios com valores válidos.");
      return;
    }

    setPetCreateLoading(true);
    setPetCreateError(null);
    setPetCreateSuccess(null);
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
      setPetCreateSuccess("Pet criado com sucesso.");
      setPetName("");
      setPetSpecies("gato");
      setPetBreed("");
      setPetBirthDate("");
      setPetWeightKg("");
      setPetNotes("");
      await refreshPets();
      setView("dashboard");
    } catch (err) {
      setPetCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setPetCreateLoading(false);
    }
  }

  async function handleCreateExpense() {
    if (
      !expenseUserId.trim() ||
      !expenseItem.trim() ||
      !expenseCategory.trim() ||
      !expenseAmount.trim() ||
      Number.isNaN(Number.parseFloat(expenseAmount)) ||
      !expenseQuantity.trim() ||
      Number.isNaN(Number.parseFloat(expenseQuantity)) ||
      !expenseUnit.trim() ||
      !expensePurchasedAt.trim() ||
      Number.isNaN(Date.parse(expensePurchasedAt))
    ) {
      setExpenseCreateError("Preencha os campos obrigatórios com valores válidos.");
      return;
    }

    setExpenseCreateLoading(true);
    setExpenseCreateError(null);
    setExpenseCreateSuccess(null);
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
      setExpenseCreateSuccess("Gasto criado com sucesso.");
      setExpenseItem("");
      setExpenseCategory("other");
      setExpenseAmount("");
      setExpenseQuantity("1");
      setExpenseUnit("unit");
      setExpensePurchasedAt("");
      await refreshExpenses();
    } catch (err) {
      setExpenseCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setExpenseCreateLoading(false);
    }
  }

  function pushMessage(next: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { id: msgId, ...next }]);
    setMsgId((prev) => prev + 1);
  }

  function runAction(action: ChatAction) {
    if (action.kind === "open-expenses") {
      setView("expenses");
      return;
    }
    setView("dashboard");
  }

  async function handleChatSend() {
    const text = chatInput.trim();
    if (!text) return;

    pushMessage({ from: "user", text, actions: [] });
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      const result = await handleMessage(text);
      setChatResponse(result);

      const actions: ChatAction[] = [];
      if (result.intent === "REGISTER_EXPENSE" && result.executionType === "created") {
        actions.push({ label: "Ver gastos", kind: "open-expenses" });
      }
      if (result.intent === "CREATE_EVENT" || result.executionType === "confirmation_required") {
        actions.push({ label: "Voltar ao painel", kind: "back-dashboard" });
      }

      pushMessage({
        from: "bot",
        text: result.assistantMessage,
        actions,
      });

      if (result.executionType === "created") {
        await Promise.all([refreshEvents(), refreshExpenses(), refreshPets()]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setChatError(message);
      pushMessage({
        from: "bot",
        text: `Erro ao falar com a IA: ${message}`,
        actions: [],
      });
    } finally {
      setChatLoading(false);
    }
  }

  const petCards = useMemo<PetCard[]>(() => {
    return pets.map((pet, index) => {
      const type = speciesToType(pet.species);
      const petEvents = events.filter((event) => event.petId === pet.id);
      const health = evaluatePetHealth(petEvents);
      const trendText = petEvents.length > 0 ? `${petEvents.length} eventos no mês` : "sem eventos";
      const trendColor = health.kind === "alert" ? "#e58b7e" : "#7bbf95";
      return {
        pet,
        type,
        health,
        trendText,
        trendColor,
        ageLabel: calcAgeLabel(pet.birthDate),
        emoji: typeEmoji(type),
        rotation: ROTATIONS[index % ROTATIONS.length],
        accent: pickAccent(index),
      };
    });
  }, [pets, events]);

  const typeCounts = useMemo(() => {
    return {
      cat: petCards.filter((p) => p.type === "cat").length,
      dog: petCards.filter((p) => p.type === "dog").length,
      bird: petCards.filter((p) => p.type === "bird").length,
      other: petCards.filter((p) => p.type === "other").length,
    };
  }, [petCards]);

  const activeCards = useMemo(() => {
    return petCards.filter((p) => p.type === activeType);
  }, [petCards, activeType]);

  const selectedCard = useMemo(() => {
    const inList = petCards.find((p) => p.pet.id === selectedPetId);
    if (inList) return inList;
    return petCards[0] ?? null;
  }, [petCards, selectedPetId]);

  const selectedTimeline = useMemo(() => {
    if (!selectedCard) return [];
    return events
      .filter((event) => event.petId === selectedCard.pet.id)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 8);
  }, [events, selectedCard]);

  const attentionCount = activeCards.filter((p) => p.health.kind !== "ok").length;

  const reminders = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .filter((event) => /(vacin|consulta|vermif|vermíf|retorno|checkup)/i.test(`${event.type} ${event.description}`))
      .slice(0, 3);
  }, [events]);

  const expenseFiltered = useMemo(() => {
    if (expenseFilter === "all") return expenses;
    return expenses.filter((expense) => expense.category.toLowerCase().includes(expenseFilter));
  }, [expenses, expenseFilter]);

  const expenseTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const monthBuckets = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      months.push({
        key,
        label: monthLabel(dt),
        total: 0,
      });
    }

    expenses.forEach((expense) => {
      const dt = new Date(expense.purchasedAt);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const target = months.find((month) => month.key === key);
      if (target) target.total += expense.amount;
    });

    return months;
  }, [expenses]);

  const monthMax = Math.max(...monthBuckets.map((month) => month.total), 1);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startWeekDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: {
      label: string;
      style: string;
      onClick: () => void;
    }[] = [];

    for (let i = 0; i < startWeekDay; i += 1) {
      const prev = new Date(year, month, i - startWeekDay + 1);
      days.push({ label: String(prev.getDate()), style: "padding:6px 0;opacity:.35", onClick: () => {} });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      const isoDay = current.toISOString().slice(0, 10);
      const dayEvents = events.filter((event) => event.occurredAt.slice(0, 10) === isoDay);
      const concern = dayEvents.some((event) => /(vomit|vômit|diarr|urg|sang|ferid)/i.test(`${event.type} ${event.description}`));
      const reminder = dayEvents.some((event) => /(vacin|consulta|vet|vermif|vermíf|checkup)/i.test(`${event.type} ${event.description}`));
      const isToday = day === now.getDate();

      let style = "padding:6px 0;border-radius:8px";
      if (concern) style = "padding:6px 0;background:#fbe7e1;color:#c25448;border-radius:8px";
      else if (reminder) style = "padding:6px 0;background:#fbeecd;color:#a07e2a;border-radius:8px";
      else if (dayEvents.length > 0) style = "padding:6px 0;background:#dcefe2;color:#3f7d59;border-radius:8px";
      if (isToday) style = "padding:6px 0;background:#e58b7e;color:#fff;border-radius:8px;font-weight:800";

      days.push({
        label: String(day),
        style,
        onClick: () => {
          if (dayEvents.length === 0) return;
          const firstEvent = dayEvents[0];
          setSelectedPetId(firstEvent.petId);
          setView("detail");
        },
      });
    }

    while (days.length < 35) {
      const next = days.length - (startWeekDay + daysInMonth) + 1;
      days.push({ label: String(next), style: "padding:6px 0;opacity:.35", onClick: () => {} });
    }

    return days.slice(0, 35);
  }, [events]);

  const monthTitle = new Date().toLocaleDateString("pt-BR", { month: "long" });

  function renderErrorOrLoading() {
    if (petsLoading || eventsLoading || expensesLoading) {
      return (
        <div style={{ background: "#fbeecd", color: "#6b5d49", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontWeight: 700 }}>
          Carregando dados reais do backend...
        </div>
      );
    }

    const errors = [petsError, eventsError, expensesError].filter(Boolean);
    if (errors.length === 0) return null;

    return (
      <div style={{ background: "#fbe7e1", color: "#c25448", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontWeight: 700 }}>
        {errors.join(" | ")}
      </div>
    );
  }

  const rootStyle: React.CSSProperties = {
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    fontFamily: "Nunito, system-ui",
    color: "#4a3f35",
    background: "#e9dfca",
  };

  if (view === "login") {
    return (
      <div style={rootStyle}>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            backgroundColor: "#e9dfca",
            backgroundImage: "radial-gradient(rgba(120,100,70,.13) 1.3px, transparent 1.3px)",
            backgroundSize: "15px 15px",
          }}
        >
          <div style={{ position: "relative", width: 360, background: "#fffdf8", borderRadius: 24, padding: "34px 32px", boxShadow: "0 16px 40px rgba(80,60,30,.20)", border: "1px solid rgba(120,100,70,.08)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#d7e8dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 12px" }}>🐾</div>
              <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 28, color: "#4a3f35" }}>Cuide do Pet</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#a2937c", marginTop: 2 }}>Cuide de quem você ama, sem esforço.</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>E-mail</div>
            <input style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "12px 14px", fontWeight: 600, fontSize: 14, color: "#4a3f35", marginBottom: 14, outline: "none" }} defaultValue="lari@email.com" />
            <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Senha</div>
            <input type="password" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "12px 14px", fontWeight: 600, fontSize: 14, color: "#4a3f35", marginBottom: 18, outline: "none" }} defaultValue="12345678" />
            <button onClick={() => setView("dashboard")} style={{ width: "100%", background: "#5c9e78", color: "#fff", fontWeight: 800, fontSize: 15, padding: 13, borderRadius: 12, border: 0, cursor: "pointer", boxShadow: "0 6px 16px rgba(92,158,120,.35)" }}>Entrar</button>
            <button onClick={() => setView("dashboard")} style={{ width: "100%", marginTop: 12, background: "#fff", color: "#4a3f35", fontWeight: 800, fontSize: 14, padding: 12, borderRadius: 12, border: "1.5px solid rgba(120,100,70,.16)", cursor: "pointer" }}>Continuar com Google</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "add-pet") {
    return (
      <div style={rootStyle}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#e9dfca", backgroundImage: "radial-gradient(rgba(120,100,70,.13) 1.3px, transparent 1.3px)", backgroundSize: "15px 15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", background: "#fffdf8", borderBottom: "1px solid rgba(120,100,70,.10)", flexShrink: 0 }}>
            <button onClick={() => setView("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14, color: "#6b5d49", background: "#f4eee2", padding: "7px 14px", borderRadius: 999, border: 0, cursor: "pointer" }}>‹ Voltar</button>
            <div style={{ width: 1, height: 22, background: "rgba(120,100,70,.14)" }} />
            <span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 18 }}>Novo pet</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "30px 24px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 620, background: "#fffdf8", borderRadius: 22, padding: "28px 30px", boxShadow: "0 12px 32px rgba(80,60,30,.18)", border: "1px solid rgba(120,100,70,.08)", height: "fit-content" }}>
              {petCreateError && <div style={{ marginBottom: 12, background: "#fbe7e1", color: "#c25448", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>{petCreateError}</div>}
              {petCreateSuccess && <div style={{ marginBottom: 12, background: "#dcefe2", color: "#3f7d59", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>{petCreateSuccess}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Nome</div>
                  <input value={petName} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetName(e.target.value); }} placeholder="Ex: Mel" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Espécie</div>
                  <input value={petSpecies} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetSpecies(e.target.value); }} placeholder="Ex: gato" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Raça</div>
                  <input value={petBreed} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetBreed(e.target.value); }} placeholder="Ex: SRD" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Peso (kg)</div>
                  <input value={petWeightKg} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetWeightKg(e.target.value); }} placeholder="Ex: 4.2" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Nascimento</div>
                  <input value={petBirthDate} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetBirthDate(e.target.value); }} type="date" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>User ID</div>
                  <input value={petUserId} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetUserId(e.target.value); }} placeholder="UUID do tutor" style={{ width: "100%", background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "#6b5d49", marginBottom: 6 }}>Observações</div>
                <textarea value={petNotes} onChange={(e) => { setPetCreateError(null); setPetCreateSuccess(null); setPetNotes(e.target.value); }} placeholder="Alergias, manias, cuidados especiais..." style={{ width: "100%", minHeight: 72, background: "#f8f3ea", border: "1.5px solid rgba(120,100,70,.14)", borderRadius: 12, padding: "11px 14px", outline: "none", resize: "vertical", fontFamily: "Nunito" }} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setView("dashboard")} style={{ fontWeight: 800, fontSize: 14, color: "#8a7c68", padding: "12px 22px", border: 0, background: "transparent", cursor: "pointer" }}>Cancelar</button>
                <button disabled={petCreateLoading} onClick={handleCreatePet} style={{ background: "#5c9e78", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 26px", borderRadius: 12, border: 0, cursor: "pointer", boxShadow: "0 6px 16px rgba(92,158,120,.35)" }}>{petCreateLoading ? "Salvando..." : "Salvar pet 🐾"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "expenses") {
    return (
      <div style={rootStyle}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#faf6ee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", background: "#fff", borderBottom: "1px solid rgba(120,100,70,.10)", flexShrink: 0 }}>
            <button onClick={() => setView("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14, color: "#6b5d49", background: "#f4eee2", padding: "7px 14px", borderRadius: 999, border: 0, cursor: "pointer" }}>‹ Voltar</button>
            <div style={{ width: 1, height: 22, background: "rgba(120,100,70,.14)" }} />
            <span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 18 }}>💰 Gastos · Casa da Lari</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
              {renderErrorOrLoading()}
              {expenseCreateError && <div style={{ marginBottom: 12, background: "#fbe7e1", color: "#c25448", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>{expenseCreateError}</div>}
              {expenseCreateSuccess && <div style={{ marginBottom: 12, background: "#dcefe2", color: "#3f7d59", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>{expenseCreateSuccess}</div>}

              <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180, background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)" }}><div style={{ fontWeight: 800, fontSize: 12, color: "#a2937c" }}>Total no período</div><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontSize: 28, marginTop: 2 }}>R$ {expenseTotal.toFixed(2)}</div></div>
                <div style={{ flex: 1, minWidth: 180, background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)" }}><div style={{ fontWeight: 800, fontSize: 12, color: "#a2937c" }}>Média mensal</div><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontSize: 28, marginTop: 2 }}>R$ {(expenseTotal / Math.max(monthBuckets.length, 1)).toFixed(2)}</div></div>
                <div style={{ flex: 1, minWidth: 180, background: "#dcefe2", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 12px rgba(80,60,30,.08)" }}><div style={{ fontWeight: 800, fontSize: 12, color: "#3f7d59" }}>Registros</div><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontSize: 28, marginTop: 2, color: "#3f7d59" }}>{expenses.length}</div></div>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)", marginBottom: 18 }}>
                <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontSize: 16, marginBottom: 14 }}>Gastos por mês</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 140, padding: "0 2px" }}>
                  {monthBuckets.map((month) => {
                    const height = Math.max(12, Math.round((month.total / monthMax) * 110));
                    return (
                      <div key={month.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                        <div style={{ fontWeight: 800, fontSize: 11, color: "#a2937c", marginBottom: 5 }}>{month.total.toFixed(0)}</div>
                        <div style={{ width: "100%", maxWidth: 54, height, background: "#5c9e78", borderRadius: "8px 8px 4px 4px", boxShadow: "0 3px 8px rgba(92,158,120,.3)" }} />
                        <div style={{ fontWeight: 800, fontSize: 11, color: "#5c9e78", marginTop: 6, textTransform: "capitalize" }}>{month.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {([
                  { key: "all", label: "Todos" },
                  { key: "food", label: "🍖 Alimentação" },
                  { key: "health", label: "🩺 Saúde" },
                  { key: "hygiene", label: "🧴 Higiene" },
                  { key: "other", label: "🎁 Outros" },
                ] as { key: ExpenseCategoryFilter; label: string }[]).map((opt) => {
                  const active = expenseFilter === opt.key;
                  return (
                    <button key={opt.key} onClick={() => setExpenseFilter(opt.key)} style={{ fontWeight: 800, fontSize: 13, padding: "9px 15px", borderRadius: 999, border: active ? 0 : "1.5px solid rgba(120,100,70,.14)", background: active ? "#5c9e78" : "#fff", color: active ? "#fff" : "#6b5d49", cursor: "pointer" }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <input value={expenseUserId} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseUserId(e.target.value); }} placeholder="User ID" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <input value={expenseItem} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseItem(e.target.value); }} placeholder="Item" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <input value={expenseCategory} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseCategory(e.target.value); }} placeholder="Categoria" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <input value={expenseAmount} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseAmount(e.target.value); }} placeholder="Valor" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <input value={expenseQuantity} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseQuantity(e.target.value); }} placeholder="Qtd" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <input value={expenseUnit} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpenseUnit(e.target.value); }} placeholder="Unidade" style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <input type="datetime-local" value={expensePurchasedAt} onChange={(e) => { setExpenseCreateError(null); setExpenseCreateSuccess(null); setExpensePurchasedAt(e.target.value); }} style={{ flex: 1, background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 12, padding: "11px 14px", outline: "none" }} />
                <button disabled={expenseCreateLoading} onClick={handleCreateExpense} style={{ background: "#5c9e78", color: "#fff", fontWeight: 800, fontSize: 14, padding: "11px 22px", borderRadius: 12, border: 0, cursor: "pointer" }}>{expenseCreateLoading ? "Adicionando..." : "+ Adicionar"}</button>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)", overflow: "hidden" }}>
                {expenseFiltered.length === 0 ? (
                  <div style={{ padding: 18, color: "#8a7c68", fontWeight: 700 }}>Nenhum gasto encontrado para o filtro selecionado.</div>
                ) : (
                  expenseFiltered.map((expense) => (
                    <div key={expense.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid rgba(120,100,70,.07)" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, background: "#dcefe2" }}>🧾</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#4a3f35" }}>{expense.item}</div>
                        <div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>{new Date(expense.purchasedAt).toLocaleString("pt-BR")}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 12, padding: "5px 10px", borderRadius: 999, background: "#f3ede1", color: "#6b5d49" }}>{expense.category}</div>
                      <div style={{ textAlign: "right", minWidth: 90 }}>
                        <div style={{ fontWeight: 900, fontSize: 15, color: "#4a3f35" }}>R$ {expense.amount.toFixed(2)}</div>
                        <div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>{expense.pricePerKg ? `R$ ${expense.pricePerKg.toFixed(2)}/kg` : `${expense.quantity} ${expense.unit}`}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedCard) {
    const colors = healthColors(selectedCard.health.kind);
    return (
      <div style={rootStyle}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#faf6ee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", background: "#fff", borderBottom: "1px solid rgba(120,100,70,.10)", flexShrink: 0 }}>
            <button onClick={() => setView("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14, color: "#6b5d49", background: "#f4eee2", padding: "7px 14px", borderRadius: 999, border: 0, cursor: "pointer" }}>‹ Voltar</button>
            <div style={{ width: 1, height: 22, background: "rgba(120,100,70,.14)" }} />
            <span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 17 }}>{selectedCard.emoji} {selectedCard.pet.name}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button onClick={() => setView("expenses")} style={{ background: "#fff", border: "1.5px solid #9fcdb2", color: "#5c9e78", fontWeight: 800, fontSize: 13, padding: "9px 15px", borderRadius: 10, cursor: "pointer" }}>📤 Resumo de gastos</button>
              <button onClick={() => { setView("dashboard"); setChatInput(`${selectedCard.pet.name} `); }} style={{ background: "#5c9e78", color: "#fff", fontWeight: 800, fontSize: 13, padding: "9px 15px", borderRadius: 10, border: 0, cursor: "pointer" }}>+ Registrar evento</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "340px 1fr", gap: 22, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ position: "relative", background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 5px 16px rgba(80,60,30,.10)", border: "1px solid rgba(120,100,70,.08)", textAlign: "center" }}>
                  <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", width: 18, height: 18, borderRadius: "50%", background: colors.pin, boxShadow: "0 2px 4px rgba(0,0,0,.3)" }} />
                  <div style={{ height: 200, borderRadius: 14, background: selectedCard.accent, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 10, fontSize: 11, color: "#b3a48c" }}>foto · {selectedCard.pet.name}</div>
                  <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 24, marginTop: 12 }}>{selectedCard.emoji} {selectedCard.pet.name}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#a2937c" }}>{selectedCard.pet.species} · {selectedCard.pet.breed}</div>
                  <div style={{ marginTop: 10, fontWeight: 900, fontSize: 13, padding: "8px 12px", borderRadius: 10, background: colors.bg, color: colors.color }}>{selectedCard.health.text}</div>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)" }}>
                  <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#a2937c", marginBottom: 12 }}>Vitais</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "#f8f3ea", borderRadius: 11, padding: 11 }}><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 800, fontSize: 18 }}>{selectedCard.pet.weightKg.toFixed(2)} kg</div><div style={{ fontWeight: 700, fontSize: 11, color: selectedCard.trendColor }}>{selectedCard.trendText}</div></div>
                    <div style={{ background: "#f8f3ea", borderRadius: 11, padding: 11 }}><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 800, fontSize: 18 }}>{selectedTimeline.length}</div><div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>eventos recentes</div></div>
                    <div style={{ background: "#f8f3ea", borderRadius: 11, padding: 11 }}><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 800, fontSize: 18 }}>{selectedCard.ageLabel}</div><div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>idade</div></div>
                    <div style={{ background: "#f8f3ea", borderRadius: 11, padding: 11 }}><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 800, fontSize: 18 }}>R$ {expenses.filter((e) => e.item.toLowerCase().includes(selectedCard.pet.name.toLowerCase())).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</div><div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>gasto vinculado</div></div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ background: "#5c9e78", color: "#fff", fontWeight: 800, fontSize: 13, padding: "9px 16px", borderRadius: 999 }}>Linha do tempo</div>
                  <button onClick={() => setView("expenses")} style={{ background: "#fff", border: "1.5px solid rgba(120,100,70,.14)", color: "#6b5d49", fontWeight: 800, fontSize: 13, padding: "9px 16px", borderRadius: 999, cursor: "pointer" }}>Gastos</button>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 12px rgba(80,60,30,.08)", border: "1px solid rgba(120,100,70,.08)" }}>
                  <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Linha do tempo</div>
                  {selectedTimeline.length === 0 ? (
                    <div style={{ color: "#8a7c68", fontWeight: 700 }}>Nenhum evento registrado para este pet.</div>
                  ) : (
                    selectedTimeline.map((event) => {
                      const concern = /(vomit|vômit|diarr|sang|ferid|urg)/i.test(`${event.type} ${event.description}`);
                      const reminder = /(vacin|consulta|vet|checkup|vermif|vermíf)/i.test(`${event.type} ${event.description}`);
                      const iconBg = concern ? "#fbe7e1" : reminder ? "#fbeecd" : "#dcefe2";
                      const iconColor = concern ? "#c25448" : reminder ? "#a07e2a" : "#3f7d59";
                      const icon = concern ? "⚠" : reminder ? "🩺" : "✅";
                      return (
                        <div key={event.id} style={{ display: "flex", gap: 14 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: iconBg, color: iconColor }}>{icon}</div>
                            <div style={{ width: 2, flex: 1, background: "rgba(120,100,70,.12)" }} />
                          </div>
                          <div style={{ paddingBottom: 18 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: iconColor }}>{event.type}</div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: "#a2937c" }}>{event.description}</div>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "#b2a18a" }}>{new Date(event.occurredAt).toLocaleString("pt-BR")}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 24px", background: "#fffdf8", borderBottom: "1px solid rgba(120,100,70,.12)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#d7e8dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>🐾</div>
            <span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 20, color: "#4a3f35" }}>Cuide do Pet</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4eee2", borderRadius: 999, padding: "5px 8px 5px 6px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "repeating-linear-gradient(45deg,#e7dcc6,#e7dcc6 6px,#ddd0b4 6px,#ddd0b4 12px)" }} />
            <span style={{ fontWeight: 900, fontSize: 14 }}>Casa da Lari</span>
            <span style={{ color: "#9a8c79", fontSize: 12 }}>▾</span>
            <div style={{ width: 1, height: 22, background: "rgba(120,100,70,.18)", margin: "0 4px" }} />

            {([
              { key: "cat", emoji: "🐱", label: "Gatos" },
              { key: "dog", emoji: "🐶", label: "Cães" },
              { key: "bird", emoji: "🐦", label: "Aves" },
              { key: "other", emoji: "🐾", label: "Outros" },
            ] as { key: AnimalType; emoji: string; label: string }[]).map((chip) => {
              const active = chip.key === activeType;
              const count = typeCounts[chip.key];
              return (
                <button key={chip.key} onClick={() => setActiveType(chip.key)} style={{ display: "flex", alignItems: "center", gap: 6, background: active ? "#dcefe2" : "transparent", color: active ? "#3f7d59" : "#8a7c68", fontWeight: active ? 900 : 800, fontSize: 13, padding: "6px 10px", borderRadius: 999, border: 0, cursor: "pointer" }}>
                  {chip.emoji} {chip.label} <span style={{ background: active ? "#fff" : "rgba(120,100,70,.12)", borderRadius: 999, padding: "0 7px", fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setView("expenses")} style={{ background: "#fff", color: "#5c9e78", fontWeight: 800, fontSize: 13, padding: "8px 16px", borderRadius: 999, border: "1.5px solid #9fcdb2", cursor: "pointer" }}>Ver gastos</button>
            <button onClick={() => setView("login")} style={{ width: 34, height: 34, borderRadius: "50%", background: "#b9a3e0", color: "#fff", fontWeight: 900, fontSize: 14, border: 0, cursor: "pointer" }}>L</button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 24px", background: "#f3ede1", borderBottom: "1px solid rgba(120,100,70,.10)", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: "#a2937c", textTransform: "uppercase", letterSpacing: ".08em" }}>{typeLabel(activeType)} da casa</span>
          {activeCards.map((card) => {
            const colors = healthColors(card.health.kind);
            return (
              <button key={card.pet.id} onClick={() => { setSelectedPetId(card.pet.id); setView("detail"); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid rgba(120,100,70,.12)", borderRadius: 999, padding: "4px 12px 4px 5px", cursor: "pointer" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: card.accent }} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>{card.pet.name}</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot }} />
              </button>
            );
          })}
          <button onClick={() => setView("add-pet")} style={{ marginLeft: "auto", fontWeight: 800, fontSize: 13, color: "#5c9e78", border: 0, background: "transparent", cursor: "pointer" }}>+ Adicionar pet</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", backgroundColor: "#e9dfca", backgroundImage: "radial-gradient(rgba(120,100,70,.13) 1.3px, transparent 1.3px)", backgroundSize: "15px 15px" }}>
          {renderErrorOrLoading()}

          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 16px" }}>
            <span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 15, color: "#5b4d3a" }}>Estado de saúde</span>
            <span style={{ fontWeight: 800, fontSize: 11, background: "#fbe7e1", color: "#c25448", padding: "3px 9px", borderRadius: 999 }}>{attentionCount > 0 ? `${attentionCount} precisam de atenção` : "tudo tranquilo"}</span>
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 24 }}>
            {activeCards.length === 0 ? (
              <div style={{ background: "#fffdf8", border: "1px solid rgba(120,100,70,.08)", borderRadius: 14, padding: 18, fontWeight: 700, color: "#8a7c68" }}>Sem pets nesse grupo ainda. Use “Adicionar pet”.</div>
            ) : (
              activeCards.map((card) => {
                const colors = healthColors(card.health.kind);
                return (
                  <button key={card.pet.id} onClick={() => { setSelectedPetId(card.pet.id); setView("detail"); }} style={{ position: "relative", width: 228, textAlign: "left", background: "#fffdf8", borderRadius: 16, padding: 13, boxShadow: "0 7px 18px rgba(80,60,30,.14)", border: "1px solid rgba(120,100,70,.08)", transform: `rotate(${card.rotation})`, cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: colors.pin, boxShadow: "0 2px 3px rgba(0,0,0,.3)" }} />
                    <div style={{ height: 110, borderRadius: 10, background: card.accent, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8, fontSize: 11, color: "#b3a48c" }}>foto · {card.pet.name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}><span style={{ fontWeight: 800, fontSize: 16 }}>{card.emoji} {card.pet.name}</span><span style={{ fontSize: 11, color: "#a2937c", fontWeight: 700 }}>{card.ageLabel}</span></div>
                    <div style={{ marginTop: 7, fontWeight: 900, fontSize: 12, padding: "6px 10px", borderRadius: 9, background: colors.bg, color: colors.color }}>{card.health.text}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700, fontSize: 12, color: "#6b5d49" }}><span>Peso {card.pet.weightKg.toFixed(2)}kg</span><span style={{ color: card.trendColor }}>{card.trendText}</span></div>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ display: "flex", gap: 18, alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1.9, minWidth: 420, background: "#fffdf8", borderRadius: 18, boxShadow: "0 7px 20px rgba(80,60,30,.14)", border: "1px solid rgba(120,100,70,.08)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 440 }}>
              <div style={{ position: "absolute", top: -9, left: 46, width: 80, height: 24, background: "rgba(143,182,218,.55)", transform: "rotate(-3deg)" }} />
              <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 9, borderBottom: "1px solid rgba(120,100,70,.08)" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#d7e8dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🐾</div>
                <div><div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 700, fontSize: 15, color: "#4a3f35" }}>Assistente</div><div style={{ fontWeight: 700, fontSize: 11, color: "#7bbf95" }}>● registra e responde sobre seus pets</div></div>
              </div>

              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", maxHeight: 360 }}>
                {messages.map((message) => {
                  if (message.from === "user") {
                    return (
                      <div key={message.id} style={{ alignSelf: "flex-end", maxWidth: "76%", background: "#5c9e78", color: "#fff", fontWeight: 700, fontSize: 14, padding: "11px 15px", borderRadius: "16px 16px 4px 16px", lineHeight: 1.45 }}>{message.text}</div>
                    );
                  }

                  return (
                    <div key={message.id} style={{ alignSelf: "flex-start", maxWidth: "82%" }}>
                      <div style={{ background: "#f3ede1", color: "#4a3f35", fontWeight: 600, fontSize: 14, padding: "12px 15px", borderRadius: "16px 16px 16px 4px", lineHeight: 1.5 }}>{message.text}</div>
                      {message.actions.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          {message.actions.map((action) => (
                            <button key={`${message.id}-${action.label}`} onClick={() => runAction(action)} style={{ background: "#fff", border: "1.5px solid #9fcdb2", color: "#5c9e78", fontWeight: 800, fontSize: 13, padding: "8px 14px", borderRadius: 999, cursor: "pointer" }}>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(120,100,70,.08)", display: "flex", flexDirection: "column", gap: 8, background: "#fbf8f0" }}>
                {chatError && <div style={{ background: "#fbe7e1", color: "#c25448", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 12 }}>{chatError}</div>}
                {chatResponse && (
                  <div style={{ background: "#f8f3ea", color: "#6b5d49", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 12 }}>
                    intent: {chatResponse.intent} · executionType: {chatResponse.executionType}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleChatSend(); }} placeholder='Ex: "a Mel vomitou" ou "comprei ração R$ 189"' style={{ flex: 1, background: "#fff", border: "1.5px solid rgba(120,100,70,.16)", borderRadius: 999, padding: "11px 16px", fontWeight: 600, fontSize: 14, color: "#4a3f35", outline: "none" }} />
                  <button disabled={chatLoading || chatInput.trim() === ""} onClick={() => void handleChatSend()} style={{ width: 42, height: 42, borderRadius: "50%", background: "#5c9e78", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 12px rgba(92,158,120,.4)", border: 0, cursor: "pointer" }}>{chatLoading ? "…" : "➤"}</button>
                </div>
              </div>
            </div>

            <div style={{ position: "relative", flex: 1, minWidth: 280, background: "#fffdf8", borderRadius: 18, boxShadow: "0 7px 20px rgba(80,60,30,.14)", border: "1px solid rgba(120,100,70,.08)", padding: "16px 18px" }}>
              <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#f7e6a8,#d9b657 72%)", boxShadow: "0 2px 3px rgba(0,0,0,.3)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 16, color: "#4a3f35", textTransform: "capitalize" }}>{monthTitle}</span><span style={{ fontWeight: 700, fontSize: 12, color: "#a2937c" }}>‹ ›</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, fontWeight: 800, fontSize: 11, color: "#b3a48c", textAlign: "center", marginBottom: 4 }}><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, textAlign: "center", fontWeight: 700, fontSize: 12, color: "#6b5d49" }}>
                {calendarDays.map((day, index) => (
                  <button key={`${day.label}-${index}`} onClick={day.onClick} style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                    <div style={{ ...(day.style.split(";").reduce((acc, rule) => {
                      const [k, v] = rule.split(":");
                      if (!k || !v) return acc;
                      const camel = k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
                      return { ...acc, [camel]: v.trim() };
                    }, {} as Record<string, string>)) as React.CSSProperties }}>{day.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontWeight: 700, fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b5d49" }}><span style={{ width: 11, height: 11, borderRadius: 4, background: "#e58b7e" }} /> Algo ruim aconteceu</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b5d49" }}><span style={{ width: 11, height: 11, borderRadius: 4, background: "#fbeecd", border: "1px solid #e8d49a" }} /> Consulta / lembrete</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b5d49" }}><span style={{ width: 11, height: 11, borderRadius: 4, background: "#dcefe2", border: "1px solid #b6dcc4" }} /> Tudo certo</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, marginTop: 18, alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1.9, minWidth: 420, background: "#fffdf8", borderRadius: 18, boxShadow: "0 7px 20px rgba(80,60,30,.14)", border: "1px solid rgba(120,100,70,.08)", padding: "16px 20px" }}>
              <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#a9c8ea,#5f88b3 72%)", boxShadow: "0 2px 3px rgba(0,0,0,.3)" }} />
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 16 }}>Gastos por mês · {typeLabel(activeType)}</div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#a2937c" }}>total no período · <span style={{ color: "#4a3f35" }}>R$ {expenseTotal.toFixed(2)}</span></div>
                </div>
                <button onClick={() => setView("expenses")} style={{ fontWeight: 800, fontSize: 12, color: "#5c9e78", background: "#dcefe2", padding: "4px 10px", borderRadius: 999, border: 0, cursor: "pointer" }}>Ver todos os gastos ›</button>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 140, padding: "0 2px" }}>
                {monthBuckets.map((month) => {
                  const height = Math.max(12, Math.round((month.total / monthMax) * 110));
                  return (
                    <div key={month.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                      <div style={{ fontWeight: 800, fontSize: 11, color: "#a2937c", marginBottom: 5 }}>{month.total.toFixed(0)}</div>
                      <div style={{ width: "100%", maxWidth: 46, height, background: "#5c9e78", borderRadius: "8px 8px 4px 4px", boxShadow: "0 3px 8px rgba(92,158,120,.3)" }} />
                      <div style={{ fontWeight: 800, fontSize: 11, color: "#5c9e78", marginTop: 6, textTransform: "capitalize" }}>{month.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ position: "relative", flex: 1, minWidth: 280, background: "#fffdf8", borderRadius: 18, boxShadow: "0 7px 20px rgba(80,60,30,.14)", border: "1px solid rgba(120,100,70,.08)", padding: "16px 18px" }}>
              <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#f5b9ac,#c25448 72%)", boxShadow: "0 2px 3px rgba(0,0,0,.3)" }} />
              <div style={{ fontFamily: "Fredoka, Nunito, system-ui", fontWeight: 600, fontSize: 16, color: "#4a3f35", marginBottom: 10 }}>Próximos lembretes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {reminders.length === 0 ? (
                  <div style={{ color: "#8a7c68", fontWeight: 700, background: "#f3ede1", borderRadius: 11, padding: "9px 11px" }}>Sem lembretes detectados nos eventos atuais.</div>
                ) : (
                  reminders.map((event) => {
                    const danger = /(urg|vomit|vômit|sang|ferid|atras)/i.test(`${event.type} ${event.description}`);
                    const warn = /(consulta|vacin|checkup|vet)/i.test(`${event.type} ${event.description}`);
                    const bg = danger ? "#fbe7e1" : warn ? "#fbeecd" : "#f3ede1";
                    const color = danger ? "#c25448" : warn ? "#a07e2a" : "#6b5d49";
                    const icon = danger ? "⚠" : warn ? "🩺" : "💊";
                    return (
                      <div key={event.id} style={{ display: "flex", alignItems: "center", gap: 10, background: bg, borderRadius: 11, padding: "9px 11px" }}>
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color }}>{event.type}</div>
                          <div style={{ fontWeight: 700, fontSize: 11, color: "#a2937c" }}>{new Date(event.occurredAt).toLocaleString("pt-BR")}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}