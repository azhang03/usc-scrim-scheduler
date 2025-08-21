"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Team {
  id: string
  name: string
  color: string
}

interface TeamSelectorProps {
  teams: Team[]
  selectedTeam: Team | null
  onTeamSelect: (teamId: string) => void
}

export function TeamSelector({ teams, selectedTeam, onTeamSelect }: TeamSelectorProps) {
  return (
    <div className="space-y-4">
      <Select onValueChange={onTeamSelect} value={selectedTeam?.id || ""}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose your team..." />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                <span>{team.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTeam && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedTeam.color }} />
          <span className="font-medium text-gray-900">Selected: {selectedTeam.name}</span>
        </div>
      )}
    </div>
  )
}
