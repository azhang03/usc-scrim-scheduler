"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"

interface Team {
  id: string
  name: string
  color: string
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}

export function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [error, setError] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    team_a_id: "",
    team_b_id: ""
  })

  // Fetch teams when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      const data = await apiFetch('/teams')
      setTeams(data)
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      addToast('Failed to load teams', 'error')
    } finally {
      setLoadingTeams(false)
    }
  }

  // Calculate end date when start date changes
  const handleStartDateChange = (startDate: string) => {
    if (startDate) {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 6) // Add 6 days to get 7-day span
      
      setFormData({
        ...formData,
        start_date: startDate,
        end_date: end.toISOString().split('T')[0] // Format as YYYY-MM-DD
      })
    } else {
      setFormData({
        ...formData,
        start_date: startDate,
        end_date: ""
      })
    }
  }

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) return false
    if (!formData.start_date) return false
    if (!formData.end_date) return false
    if (!formData.team_a_id) return false
    if (!formData.team_b_id) return false
    if (formData.team_a_id === formData.team_b_id) return false
    
    // Validate one-week duration
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays !== 6) return false // 6 days difference = 7-day span
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in to create an event")
      setLoading(false)
      return
    }

    if (!validateForm()) {
      setError("Please fill in all required fields and ensure the event duration is exactly one week")
      setLoading(false)
      return
    }

    try {
      // Normalize dates to date-only format (strip any time component)
      const normalizedData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString().split('T')[0],
        end_date: new Date(formData.end_date).toISOString().split('T')[0]
      }

      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(normalizedData)
      })

      addToast('Event created successfully!', 'success')
      onEventCreated()
      onClose()
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        team_a_id: "",
        team_b_id: ""
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create event"
      setError(errorMessage)
      addToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get validation errors
  const getValidationErrors = () => {
    const errors: string[] = []
    
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays !== 6) {
        errors.push("End date must be exactly one week after start date")
      }
    }
    
    if (formData.team_a_id && formData.team_b_id && formData.team_a_id === formData.team_b_id) {
      errors.push("Please select two different teams")
    }
    
    return errors
  }

  const validationErrors = getValidationErrors()
  const isFormValid = validateForm()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-[#990000]">Create New Event</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter event name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically set to one week after start date
              </p>
            </div>

            <div>
              <Label htmlFor="team_a">Team A *</Label>
              <Select value={formData.team_a_id} onValueChange={(value) => setFormData({ ...formData, team_a_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select Team A"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingTeams ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading teams...
                    </div>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          />
                          <span>{team.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team_b">Team B *</Label>
              <Select value={formData.team_b_id} onValueChange={(value) => setFormData({ ...formData, team_b_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select Team B"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingTeams ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading teams...
                    </div>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          />
                          <span>{team.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {validationErrors.length > 0 && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded space-y-1">
                {validationErrors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#990000] hover:bg-[#800000] text-white"
                disabled={loading || !isFormValid || loadingTeams}
              >
                {loading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
