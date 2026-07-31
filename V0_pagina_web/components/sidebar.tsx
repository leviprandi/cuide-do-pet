"use client"

import { LayoutDashboard, PawPrint, DollarSign, Calendar, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: PawPrint, label: "Meus Pets", active: false },
  { icon: DollarSign, label: "Gastos", active: false },
  { icon: Calendar, label: "Eventos", active: false },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
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
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  item.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  item.active ? "text-emerald-600" : "text-gray-400"
                )} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Add Button */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Rápido
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem>Novo Pet</DropdownMenuItem>
            <DropdownMenuItem>Novo Gasto</DropdownMenuItem>
            <DropdownMenuItem>Novo Evento</DropdownMenuItem>
            <DropdownMenuItem>Nova Vacina</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
