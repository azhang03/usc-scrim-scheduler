"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogIn, UserPlus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { AvailabilityGrid } from "@/components/availability-grid"
import { TeamSelector } from "@/components/team-selector"
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

interface AvailabilitySlot {
  day_index: number
  hour_index: number
}

interface DatabaseAvailabilitySlot {
  day_index: number
  hour_index: number
  team_id: string
  team_name: string
  team_color: string
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const { addToast } = useToast()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [availability, setAvailability] = useState<boolean[][]>([])
  const [allTeamAvailability, setAllTeamAvailability] = useState<DatabaseAvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvent()
  }, [resolvedParams.id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const data = await apiFetch(`/events/${resolvedParams.id}`)
      setEvent(data)
      
      // Fetch availability data for this event
      await fetchAvailability()
    } catch (error) {
      console.error('Failed to fetch event:', error)
      setError('Failed to load event')
      addToast('Failed to load event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    try {
      const data = await apiFetch(`/availability/event/${resolvedParams.id}`)
      setAllTeamAvailability(data)
      
      // Initialize empty availability grid (7 days x 24 hours)
      const grid = Array(7).fill(null).map(() => Array(24).fill(false))
      setAvailability(grid)
    } catch (error) {
      console.error('Failed to fetch availability:', error)
      // Don't show error toast for availability fetch failure
      // Just initialize empty grid
      const grid = Array(7).fill(null).map(() => Array(24).fill(false))
      setAvailability(grid)
    }
  }

  const handleTeamSelect = (teamId: string) => {
    if (!event) return
    
    const team = teamId === event.team_a.id ? event.team_a : 
                 teamId === event.team_b.id ? event.team_b : null
    setSelectedTeam(team)
    
    // Load user's availability for the selected team
    loadUserAvailability(teamId)
  }

  const loadUserAvailability = async (teamId: string) => {
    try {
      const data = await apiFetch(`/availability/event/${resolvedParams.id}/user`)
      
      // Filter availability for the selected team
      const teamAvailability = data.filter((slot: any) => slot.team_id === teamId)
      
      // Convert to grid format
      const grid = Array(7).fill(null).map(() => Array(24).fill(false))
      teamAvailability.forEach((slot: any) => {
        grid[slot.day_index][slot.hour_index] = true
      })
      
      setAvailability(grid)
    } catch (error) {
      console.error('Failed to load user availability:', error)
      // Initialize empty grid if no availability found
      const grid = Array(7).fill(null).map(() => Array(24).fill(false))
      setAvailability(grid)
    }
  }

  const handleSaveAvailability = async () => {
    if (!selectedTeam || !event) {
      setError("Please select a team first")
      return
    }

    // Convert availability grid to slots
    const slots: AvailabilitySlot[] = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (availability[day][hour]) {
          slots.push({ day_index: day, hour_index: hour })
        }
      }
    }

    try {
      setSaving(true)
      setError("")
      
      await apiFetch('/availability', {
        method: 'POST',
        body: JSON.stringify({
          event_id: event.id,
          team_id: selectedTeam.id,
          availability: slots
        })
      })

      addToast('Availability saved successfully!', 'success')
      
      // Refresh availability data to show updated overlaps
      await fetchAvailability()
      
      // Reload user's availability
      await loadUserAvailability(selectedTeam.id)
    } catch (error) {
      console.error('Failed to save availability:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save availability'
      setError(errorMessage)
      addToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!event || !user || event.created_by !== user.id) {
      return
    }

    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      await apiFetch(`/events/${event.id}`, {
        method: 'DELETE'
      })
      
      addToast('Event deleted successfully', 'success')
      // Redirect to homepage
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete event:', error)
      addToast('Failed to delete event', 'error')
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
          <Link href="/">
            <Button className="bg-[#990000] hover:bg-[#800000] text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[#990000] hover:bg-[#990000]/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#990000]">{event.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: event.team_a.color }}
                  >
                    <span className="text-white text-xs font-bold">{event.team_a.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: event.team_b.color }}
                  >
                    <span className="text-white text-xs font-bold">{event.team_b.name.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
            {user && event.created_by === user.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteEvent}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            )}
          </div>
        </div>

        {!user ? (
          /* Login Section */
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-gray-900">Join the Event</CardTitle>
              <p className="text-gray-600">Login or register to mark your availability</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login">
                <Button className="w-full bg-[#990000] hover:bg-[#800000] text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full border-[#990000] text-[#990000] hover:bg-[#990000]/10 bg-transparent"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Main Event Interface */
          <div className="space-y-8">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-gray-600">{event.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Start Date:</span>
                    <p className="text-gray-600">{formatDate(event.start_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">End Date:</span>
                    <p className="text-gray-600">{formatDate(event.end_date)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Event Duration:</strong> One week (7 days)
                </div>
              </CardContent>
            </Card>

            {/* Team Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Select Your Team</CardTitle>
                <p className="text-gray-600">Choose which team you're representing</p>
              </CardHeader>
              <CardContent>
                <TeamSelector
                  teams={[event.team_a, event.team_b]}
                  selectedTeam={selectedTeam}
                  onTeamSelect={handleTeamSelect}
                />
              </CardContent>
            </Card>

            {/* Availability Grid */}
            {selectedTeam && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Mark Your Availability</CardTitle>
                  <p className="text-gray-600">
                    Click and drag to select times when you're available for {selectedTeam.name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AvailabilityGrid
                    selectedTeam={selectedTeam}
                    availability={availability}
                    onAvailabilityChange={setAvailability}
                    allTeamAvailability={allTeamAvailability}
                  />
                  
                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSaveAvailability}
                    disabled={saving}
                    className="w-full bg-[#FFC72C] hover:bg-[#E6B329] text-[#990000] font-semibold"
                  >
                    {saving ? "Saving..." : "Save Availability"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
