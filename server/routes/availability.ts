import { Router } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// Get availability for an event with team information
router.get('/event/:eventId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('availability')
      .select(`
        day_index,
        hour_index,
        team_id,
        teams!inner(id, name, color)
      `)
      .eq('event_id', req.params.eventId)
    
    if (error) throw error
    
    // Format data for frontend
    const formattedData = data.map((slot: any) => ({
      day_index: slot.day_index,
      hour_index: slot.hour_index,
      team_id: slot.team_id,
      team_name: slot.teams.name,
      team_color: slot.teams.color
    }))
    
    res.json(formattedData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

// Set availability for user
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Saving availability with body:', req.body)
    console.log('User:', req.user)
    
    const { event_id, availability, team_id } = req.body
    
    if (!event_id || !availability || !team_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: event_id, availability, team_id' 
      })
    }

    // Verify the team is valid for this event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('team_a_id, team_b_id')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (team_id !== event.team_a_id && team_id !== event.team_b_id) {
      return res.status(400).json({ error: 'Invalid team for this event' })
    }
    
    // Delete existing availability for this user/event
    await supabaseAdmin
      .from('availability')
      .delete()
      .eq('event_id', event_id)
      .eq('user_id', req.user!.id)
    
    // Insert new availability
    const availabilityData = availability.map((slot: any) => ({
      event_id,
      user_id: req.user!.id,
      team_id,
      day_index: slot.day_index,
      hour_index: slot.hour_index
    }))
    
    console.log('Inserting availability data:', availabilityData)
    
    const { data, error } = await supabaseAdmin
      .from('availability')
      .insert(availabilityData)
      .select()
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    console.log('Availability saved successfully:', data)
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to save availability' })
  }
})

// Get user's availability for an event
router.get('/event/:eventId/user', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('availability')
      .select(`
        day_index,
        hour_index,
        team_id,
        teams!inner(id, name, color)
      `)
      .eq('event_id', req.params.eventId)
      .eq('user_id', req.user!.id)
    
    if (error) throw error
    
    // Format data for frontend
    const formattedData = data.map((slot: any) => ({
      day_index: slot.day_index,
      hour_index: slot.hour_index,
      team_id: slot.team_id,
      team_name: slot.teams.name,
      team_color: slot.teams.color
    }))
    
    res.json(formattedData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user availability' })
  }
})

export default router
