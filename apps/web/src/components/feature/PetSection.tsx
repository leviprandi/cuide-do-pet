import { PawPrint, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Pet } from "../../types/pet";

interface PetSectionProps {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weightKg: string;
  notes: string;
  userId: string;
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  onNameChange: (v: string) => void;
  onSpeciesChange: (v: string) => void;
  onBreedChange: (v: string) => void;
  onBirthDateChange: (v: string) => void;
  onWeightKgChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onUserIdChange: (v: string) => void;
  onSubmit: () => void;
}

function PetCard({ pet }: { pet: Pet }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet-50">
        <PawPrint className="w-5 h-5 text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm text-gray-800 truncate">{pet.name}</span>
          <span className="text-xs font-semibold text-violet-600 shrink-0">
            {pet.weightKg.toFixed(2)} kg
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide">
            {pet.species}
          </span>
          <span className="text-xs text-gray-400 truncate">{pet.breed}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Nascimento: {new Date(pet.birthDate).toLocaleDateString("pt-BR")}
        </p>
        {pet.notes && (
          <p className="text-xs text-gray-500 mt-1 italic truncate">{pet.notes}</p>
        )}
      </div>
    </div>
  );
}

export function PetSection({
  pets, loading, error,
  name, species, breed, birthDate, weightKg, notes, userId,
  createLoading, createError, createSuccess,
  onNameChange, onSpeciesChange, onBreedChange, onBirthDateChange,
  onWeightKgChange, onNotesChange, onUserIdChange, onSubmit,
}: PetSectionProps) {
  const isSubmitDisabled =
    createLoading ||
    !name.trim() ||
    !species.trim() ||
    !breed.trim() ||
    !birthDate.trim() ||
    isNaN(Date.parse(birthDate)) ||
    !weightKg.trim() ||
    isNaN(parseFloat(weightKg)) ||
    !userId.trim();

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Pets</h2>

      {/* Pet list */}
      <div className="mb-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando pets…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{error}
          </div>
        )}
        {!loading && !error && pets.length === 0 && (
          <p className="text-sm text-gray-400 py-4">Nenhum pet cadastrado.</p>
        )}
        {pets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>

      {/* Add Pet form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Adicionar Pet</h3>
        <div className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Nome</span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Espécie</span>
            <input
              value={species}
              onChange={(e) => onSpeciesChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Raça</span>
            <input
              value={breed}
              onChange={(e) => onBreedChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Data de nascimento (ISO)</span>
            <input
              value={birthDate}
              onChange={(e) => onBirthDateChange(e.target.value)}
              placeholder="2020-01-15"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Peso (kg)</span>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => onWeightKgChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Observações (opcional)</span>
            <input
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">userId (UUID)</span>
            <input
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
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
            Criar Pet
          </button>
        </div>

        {createError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{createError}
          </div>
        )}
        {createSuccess && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Pet criado com sucesso.
          </div>
        )}
      </div>
    </section>
  );
}
