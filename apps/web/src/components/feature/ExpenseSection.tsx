import { DollarSign, ShoppingCart, Pill, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Expense } from "../../types/expense";

interface ExpenseSectionProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  userId: string;
  item: string;
  category: string;
  amount: string;
  quantity: string;
  unit: string;
  purchasedAt: string;
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  onUserIdChange: (v: string) => void;
  onItemChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onUnitChange: (v: string) => void;
  onPurchasedAtChange: (v: string) => void;
  onSubmit: () => void;
}

// Display-layer mapping: maps expense.category substrings to an icon+colour.
// The backend category is a free-form string (e.g. "food", "medicine", "vet").
// This mapping is purely visual and does not affect logic or API contracts.
type CategoryDisplayConfig = {
  Icon: typeof DollarSign;
  bgColor: string;
  iconColor: string;
};

function getCategoryDisplayConfig(category: string): CategoryDisplayConfig {
  const c = category.toUpperCase();
  if (c.includes("FOOD") || c.includes("RACAO") || c.includes("RAÇÃO") || c.includes("ALIMENT")) {
    return { Icon: ShoppingCart, bgColor: "bg-green-50", iconColor: "text-green-600" };
  }
  if (c.includes("MED") || c.includes("REMEDIO") || c.includes("REMÉDIO") || c.includes("VET") || c.includes("CONSULT")) {
    return { Icon: Pill, bgColor: "bg-blue-50", iconColor: "text-blue-500" };
  }
  // default: hygiene, toy, accessory, or any uncategorised expense
  return { Icon: DollarSign, bgColor: "bg-amber-50", iconColor: "text-amber-600" };
}

function ExpenseCard({ expense }: { expense: Expense }) {
  const { Icon, bgColor, iconColor } = getCategoryDisplayConfig(expense.category);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm text-gray-800 truncate">{expense.item}</span>
          <span className="text-sm font-semibold text-emerald-600 shrink-0">
            R$ {expense.amount.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide">
            {expense.category}
          </span>
          <span className="text-xs text-gray-400">
            {expense.quantity} {expense.unit}
          </span>
        </div>
        {expense.pricePerKg != null && (
          <p className="text-xs text-gray-400 mt-0.5">
            R$ {expense.pricePerKg.toFixed(2)}/kg
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(expense.purchasedAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

export function ExpenseSection({
  expenses, loading, error,
  userId, item, category, amount, quantity, unit, purchasedAt,
  createLoading, createError, createSuccess,
  onUserIdChange, onItemChange, onCategoryChange, onAmountChange,
  onQuantityChange, onUnitChange, onPurchasedAtChange, onSubmit,
}: ExpenseSectionProps) {
  const isSubmitDisabled =
    createLoading ||
    !userId.trim() ||
    !item.trim() ||
    !category.trim() ||
    !amount.trim() ||
    isNaN(parseFloat(amount)) ||
    !quantity.trim() ||
    isNaN(parseFloat(quantity)) ||
    !unit.trim() ||
    !purchasedAt.trim() ||
    isNaN(Date.parse(purchasedAt));

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Gastos</h2>

      {/* Expense list */}
      <div className="mb-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando gastos…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{error}
          </div>
        )}
        {!loading && !error && expenses.length === 0 && (
          <p className="text-sm text-gray-400 py-4">Nenhum gasto registrado.</p>
        )}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      {/* Add Expense form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Adicionar Gasto</h3>
        <div className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">userId (UUID)</span>
            <input
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Item</span>
            <input
              value={item}
              onChange={(e) => onItemChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Categoria</span>
            <input
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="food"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Valor (R$)</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Quantidade</span>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Unidade</span>
            <input
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              placeholder="kg"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Data da compra (ISO)</span>
            <input
              value={purchasedAt}
              onChange={(e) => onPurchasedAtChange(e.target.value)}
              placeholder="2026-03-30T18:00:00.000Z"
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
            Criar Gasto
          </button>
        </div>

        {createError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">Erro: </span>{createError}
          </div>
        )}
        {createSuccess && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Gasto criado com sucesso.
          </div>
        )}
      </div>
    </section>
  );
}
