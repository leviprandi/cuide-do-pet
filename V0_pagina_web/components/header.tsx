"use client"

import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const pets = [
  { id: 1, name: "Luna", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop" },
  { id: 2, name: "Floquinho", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop" },
  { id: 3, name: "Mel", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&h=100&fit=crop" },
]

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      {/* Pet Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
          <span className="text-sm text-gray-600">Seletor de Pet:</span>
          <span className="font-medium text-gray-800">Luna</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
          <Avatar className="w-8 h-8 border-2 border-amber-400">
            <AvatarImage src={pets[0].image} alt="Luna" />
            <AvatarFallback>LU</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {pets.map((pet) => (
            <DropdownMenuItem key={pet.id} className="flex items-center gap-3">
              <Avatar className="w-6 h-6">
                <AvatarImage src={pet.image} alt={pet.name} />
                <AvatarFallback>{pet.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {pet.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Avatar */}
      <Avatar className="w-9 h-9 bg-amber-100">
        <AvatarFallback className="bg-amber-100 text-amber-700 font-medium">U</AvatarFallback>
      </Avatar>
    </header>
  )
}
