export interface User {
  id: string
  email: string
  team_id?: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Event {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  team_a_id: string
  team_b_id: string
  created_by: string
  created_at: string
}

export interface Availability {
  id: string
  event_id: string
  user_id: string
  team_id: string
  day_index: number
  hour_index: number
  created_at: string
}

export interface AuthRequest extends Request {
  user?: User
}
