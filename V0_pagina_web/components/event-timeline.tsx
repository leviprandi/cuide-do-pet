"use client"

import { DollarSign, Eye, Syringe } from "lucide-react"
import { cn } from "@/lib/utils"

type EventType = "expense" | "observation" | "vaccine"

interface Event {
  id: number
  type: EventType
  title: string
  subtitle: string
  date: string
}

const events: Event[] = [
  {
    id: 1,
    type: "expense",
    title: "Gasto Registrado (IA)",
    subtitle: "Ração Golden 10kg - R$ 150,00 - Hoje",
    date: "Hoje",
  },
  {
    id: 2,
    type: "observation",
    title: "Sintoma/Observação",
    subtitle: "Floquinho",
    date: "Hoje",
  },
  {
    id: 3,
    type: "vaccine",
    title: "Vaccina/Vaccino",
    subtitle: "Floquinho",
    date: "21 Noje",
  },
  {
    id: 4,
    type: "vaccine",
    title: "Vaccina/Malguillo",
    subtitle: "Floquinho",
    date: "21 Noje",
  },
  {
    id: 5,
    type: "observation",
    title: "Sintoma/Observação",
    subtitle: "Floquinho",
    date: "31 Noje",
  },
]

const eventConfig: Record<EventType, { icon: typeof DollarSign; bgColor: string; iconColor: string }> = {
  expense: {
    icon: DollarSign,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  observation: {
    icon: Eye,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  vaccine: {
    icon: Syringe,
    bgColor: "bg-rose-50",
    iconColor: "text-rose-500",
  },
}

function EventCard({ event }: { event: Event }) {
  const config = eventConfig[event.type]
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
        <Icon className={cn("w-5 h-5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-800 text-sm truncate">{event.title}</h3>
          <span className="text-xs text-gray-400 shrink-0">{event.date}</span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{event.subtitle}</p>
      </div>
    </div>
  )
}

export function EventTimeline() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Timeline de Eventos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
