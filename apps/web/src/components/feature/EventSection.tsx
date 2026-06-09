import { Syringe, Eye, Calendar, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Event } from "../../types/event";
import type { Pet } from "../../types/pet";

interface EventSectionProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  pets: Pet[];
  petId: string;
  type: string;
  description: string;
  occurredAt: string;
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  onPetIdChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onOccurredAtChange: (v: string) => void;
  onSubmit: () => void;
}

// Display-layer mapping: maps backend event.type substrings to an icon+colour.
// The backend type is a free-form string (e.g. "VACCINE", "OBSERVATION", "CHECKUP").
// This mapping is purely visual and does not affect logic or API contracts.
type EventDisplayConfig = {
  Icon: typeof Syringe;
  bgColor: string;
  iconColor: string;
};

function getEventDisplayConfig(eventType: string): EventDisplayConfig {
  const t = eventType.toUpperCase();
  if (t.includes("VACCINE") || t.includes("VACINA")) {
    return { Icon: Syringe, bgColor: "bg-rose-50", iconColor: "text-rose-500" };
  }
  if (t.includes("CHECKUP") || t.includes("VET") || t.includes("CONSULT")) {
    return { Icon: Calendar, bgColor: "bg-blue-50", iconColor: "text-blue-500" };
  }
  // default: observation / symptom / anything else
  return { Icon: Eye, bgColor: "bg-amber-50", iconColor: "text-amber-600" };
}

function EventCard({ event }: { event: Event }) {
  const { Icon, bgColor, iconColor } = getEventDisplayConfig(event.type);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide truncate max-w-[120px]">
            {event.type}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(event.occurredAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1 truncate">{event.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(event.occurredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export function EventSection({
  events, loading, error,
  pets, petId, type, description, occurredAt,
  createLoading, createError, createSuccess,
  onPetIdChange, onTypeChange, onDescriptionChange, onOccurredAtChange, onSubmit,
}: EventSectionProps) {
  const isSubmitDisabled =
    createLoading ||
    !petId.trim() ||
    !type.trim() ||
    !description.trim() ||
    !occurredAt.trim() ||
    isNaN(Date.parse(occurredAt));

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Eventos</h2>

      {/* Event list */}
      <div className="mb-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando eventos…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{error}
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm text-gray-400 py-4">Nenhum evento registrado.</p>
        )}
        {events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Add Event form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Adicionar Evento</h3>
        <div className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Pet</span>
            <select
              value={petId}
              onChange={(e) => onPetIdChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              <option value="">— selecionar pet —</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name} — {pet.species}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Tipo</span>
            <input
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
              placeholder="VACCINE"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Descrição</span>
            <input
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Data/hora (ISO)</span>
            <input
              value={occurredAt}
              onChange={(e) => onOccurredAtChange(e.target.value)}
              placeholder="2026-03-30T10:00:00.000Z"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <button
            disabled={isSubmitDisabled}
            onClick={onSubmit}
            className={cn(
              "self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isSubmitDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Evento
          </button>
        </div>

        {createError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{createError}
          </div>
        )}
        {createSuccess && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Evento criado com sucesso.
          </div>
        )}
      </div>
    </section>
  );
}
