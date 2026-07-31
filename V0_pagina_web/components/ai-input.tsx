"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function AIInput() {
  const [message, setMessage] = useState("")

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm">
      {/* AI Icon */}
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Bot className="w-6 h-6 text-emerald-600" />
      </div>

      {/* Input Area */}
      <div className="flex-1">
        <Textarea
          placeholder='Diga: "Floquinho vomitou agora há pouco"'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] resize-none border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Send Button */}
      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-[80px]">
        Enviar
      </Button>
    </div>
  )
}
