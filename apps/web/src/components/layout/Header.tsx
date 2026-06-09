import type { Pet } from "../../types/pet";

interface HeaderProps {
  pets: Pet[];
  selectedPetId: string;
  onSelectPet: (id: string) => void;
}

export function Header({ pets, selectedPetId, onSelectPet }: HeaderProps) {
  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Pet Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Pet:</span>
        {pets.length === 0 ? (
          <span className="text-sm text-gray-400">Nenhum pet cadastrado</span>
        ) : (
          <select
            value={selectedPetId}
            onChange={(e) => onSelectPet(e.target.value)}
            className="text-sm font-medium text-gray-800 bg-transparent border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="">— selecionar —</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        )}
        {selectedPet && (
          <span className="text-xs text-gray-400">{selectedPet.breed}</span>
        )}
      </div>

      {/* User Avatar */}
      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
        <span className="text-sm font-medium text-amber-700">U</span>
      </div>
    </header>
  );
}
