"use client";

import { LayoutDashboard, PawPrint, DollarSign, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", sectionId: "section-top" },
  { icon: PawPrint, label: "Meus Pets", sectionId: "section-pets" },
  { icon: DollarSign, label: "Gastos", sectionId: "section-expenses" },
  { icon: Calendar, label: "Eventos", sectionId: "section-events" },
];

const quickAddItems = [
  { label: "Novo Pet", sectionId: "section-pets" },
  { label: "Novo Evento", sectionId: "section-events" },
  { label: "Novo Gasto", sectionId: "section-expenses" },
  { label: "IA", sectionId: "section-ai" },
];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <PawPrint className="w-5 h-5 text-emerald-600" />
        </div>
        <span className="font-semibold text-lg text-gray-800">Cuide do Pet</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => scrollToSection(item.sectionId)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Add */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
          Adicionar Rápido
        </p>
        <ul className="space-y-1">
          {quickAddItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => scrollToSection(item.sectionId)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
