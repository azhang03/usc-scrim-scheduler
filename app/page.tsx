"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import { CreateEventModal } from "@/components/create-event-modal"
import { Navbar } from "@/components/navbar"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"

interface Team {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  team_a: Team
  team_b: Team
  created_by: string
  created_at: string
}

export default function HomePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/events')
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      addToast('Failed to load events', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      await apiFetch(`/events/${eventId}`, {
        method: 'DELETE'
      })
      
      // Remove the event from the local state
      setEvents(events.filter(event => event.id !== eventId))
      addToast('Event deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete event:', error)
      addToast('Failed to delete event', 'error')
    }
  }

  const handleEventCreated = () => {
    fetchEvents()
  }

  // Format date for display (date-only, no time)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upcoming Events</h2>
          <p className="text-gray-600">Join or create scrimmage events with other teams</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-[#FFC72C]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">{event.name}</CardTitle>
                    {user && event.created_by === user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  )}
                  
                  {/* Team Display */}
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: event.team_a.color }}
                      />
                      <span className="text-sm font-medium">{event.team_a.name}</span>
                    </div>
                    <span className="text-gray-400 font-bold">vs</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: event.team_b.color }}
                      />
                      <span className="text-sm font-medium">{event.team_b.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {formatDate(event.start_date)}
                    </span>
                  </div>
                  
                  <Link href={`/event/${event.id}`}>
                    <Button className="w-full bg-[#FFC72C] hover:bg-[#E6B329] text-[#990000] font-semibold rounded-lg transition-colors duration-200">
                      Join Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Create your first scrim event to get started</p>
            <Button 
              className="bg-[#990000] hover:bg-[#800000] text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  )
}
