import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AIInput } from "@/components/ai-input"
import { EventTimeline } from "@/components/event-timeline"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* AI Input Section */}
            <AIInput />

            {/* Event Timeline */}
            <EventTimeline />
          </div>
        </main>
      </div>
    </div>
  )
}
