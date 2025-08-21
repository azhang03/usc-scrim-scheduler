"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

interface Team {
  id: string
  name: string
  color: string
}

interface AvailabilitySlot {
  day_index: number
  hour_index: number
  team_id: string
  team_name: string
  team_color: string
}

interface AvailabilityGridProps {
  selectedTeam: Team
  availability: boolean[][]
  onAvailabilityChange: (availability: boolean[][]) => void
  allTeamAvailability?: AvailabilitySlot[]
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const hours = Array.from({ length: 24 }, (_, i) => {
  const hour = i === 0 ? 12 : i > 12 ? i - 12 : i
  const period = i < 12 ? "AM" : "PM"
  return `${hour}:00 ${period}`
})

export function AvailabilityGrid({ 
  selectedTeam, 
  availability, 
  onAvailabilityChange, 
  allTeamAvailability = [] 
}: AvailabilityGridProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectMode, setSelectMode] = useState<"add" | "remove">("add")
  const gridRef = useRef<HTMLDivElement>(null)

  // Initialize availability grid if empty
  const currentAvailability =
    availability.length === 0 ? Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false)) : availability

  const handleMouseDown = useCallback(
    (dayIndex: number, hourIndex: number) => {
      setIsSelecting(true)
      const newMode = currentAvailability[dayIndex][hourIndex] ? "remove" : "add"
      setSelectMode(newMode)

      const newAvailability = [...currentAvailability]
      newAvailability[dayIndex][hourIndex] = newMode === "add"
      onAvailabilityChange(newAvailability)
    },
    [currentAvailability, onAvailabilityChange],
  )

  const handleMouseEnter = useCallback(
    (dayIndex: number, hourIndex: number) => {
      if (!isSelecting) return

      const newAvailability = [...currentAvailability]
      newAvailability[dayIndex][hourIndex] = selectMode === "add"
      onAvailabilityChange(newAvailability)
    },
    [isSelecting, selectMode, currentAvailability, onAvailabilityChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false)
  }, [])

  // Calculate overlaps based on real data
  const getBlockStyle = (dayIndex: number, hourIndex: number) => {
    const isSelected = currentAvailability[dayIndex][hourIndex]
    
    // Get all teams available at this time slot
    const availableTeams = allTeamAvailability.filter(
      slot => slot.day_index === dayIndex && slot.hour_index === hourIndex
    )
    
    const otherTeams = availableTeams.filter(slot => slot.team_id !== selectedTeam.id)
    const overlappingTeams = otherTeams.length

    if (!isSelected && overlappingTeams === 0) {
      return "bg-white border border-gray-200 hover:bg-gray-50"
    }

    if (isSelected && overlappingTeams === 0) {
      return `border border-gray-200 hover:opacity-80`
    }

    if (isSelected && overlappingTeams > 0) {
      // Perfect match - all teams available (assuming 2 teams total)
      if (overlappingTeams >= 1) {
        return "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 border border-gray-200 animate-pulse shadow-lg"
      }
      // Partial overlap
      return `border border-gray-200 hover:opacity-80 shadow-md`
    }

    if (!isSelected && overlappingTeams > 0) {
      return "bg-gray-100 border border-gray-200 hover:bg-gray-150"
    }

    return "bg-white border border-gray-200 hover:bg-gray-50"
  }

  const getBlockColor = (dayIndex: number, hourIndex: number) => {
    const isSelected = currentAvailability[dayIndex][hourIndex]
    if (!isSelected) return {}

    // Get all teams available at this time slot
    const availableTeams = allTeamAvailability.filter(
      slot => slot.day_index === dayIndex && slot.hour_index === hourIndex
    )
    
    const otherTeams = availableTeams.filter(slot => slot.team_id !== selectedTeam.id)
    const overlappingTeams = otherTeams.length

    if (overlappingTeams === 0) {
      return { backgroundColor: selectedTeam.color }
    }

    // Darken the color for overlaps
    const opacity = Math.min(0.9, 0.6 + overlappingTeams * 0.1)
    return { backgroundColor: selectedTeam.color, opacity }
  }

  return (
    <div className="overflow-x-auto">
      <div
        ref={gridRef}
        className="grid grid-cols-8 gap-0 min-w-[800px] select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header row */}
        <div className="p-2 bg-gray-100 border border-gray-200 font-medium text-sm text-gray-700">Time</div>
        {days.map((day) => (
          <div
            key={day}
            className="p-2 bg-gray-100 border border-gray-200 font-medium text-sm text-gray-700 text-center"
          >
            {day}
          </div>
        ))}

        {/* Time slots */}
        {hours.map((hour, hourIndex) => (
          <div key={hour} className="contents">
            <div className="p-2 bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium">{hour}</div>
            {days.map((day, dayIndex) => (
              <div
                key={`${day}-${hour}`}
                className={cn("h-8 cursor-pointer transition-all duration-150", getBlockStyle(dayIndex, hourIndex))}
                style={getBlockColor(dayIndex, hourIndex)}
                onMouseDown={() => handleMouseDown(dayIndex, hourIndex)}
                onMouseEnter={() => handleMouseEnter(dayIndex, hourIndex)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedTeam.color }} />
          <span>Your availability</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedTeam.color, opacity: 0.7 }} />
          <span>Overlap with other teams</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400" />
          <span>Perfect match (all teams available)</span>
        </div>
      </div>
    </div>
  )
}
