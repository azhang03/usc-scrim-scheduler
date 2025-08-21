import { Router } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { Event } from '../types'

const router = Router()

// Get all events with team information
router.get('/', async (req, res) => {
  try {
    console.log('Fetching events...')
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        team_a:teams!team_a_id(id, name, color),
        team_b:teams!team_b_id(id, name, color)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    console.log('Events fetched successfully:', data)
    res.json(data)
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// Get single event with team information
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        team_a:teams!team_a_id(id, name, color),
        team_b:teams!team_b_id(id, name, color)
      `)
      .eq('id', req.params.id)
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(404).json({ error: 'Event not found' })
  }
})

// Create event
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Creating event with body:', req.body)
    console.log('User:', req.user)
    
    const { name, description, start_date, end_date, team_a_id, team_b_id } = req.body
    
    if (!name || !start_date || !end_date || !team_a_id || !team_b_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, start_date, end_date, team_a_id, team_b_id' 
      })
    }

    if (team_a_id === team_b_id) {
      return res.status(400).json({ 
        error: 'Team A and Team B must be different' 
      })
    }

    // Validate one-week duration
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays !== 6) {
      return res.status(400).json({ 
        error: 'Event duration must be exactly one week (7 days). End date must be 6 days after start date.' 
      })
    }

    // Verify both teams exist
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .in('id', [team_a_id, team_b_id])
    
    if (teamsError || teams.length !== 2) {
      return res.status(400).json({ 
        error: 'One or both selected teams do not exist' 
      })
    }

    // Normalize dates to date-only format
    const normalizedStartDate = startDate.toISOString().split('T')[0]
    const normalizedEndDate = endDate.toISOString().split('T')[0]
    
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        name,
        description,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        team_a_id,
        team_b_id,
        created_by: req.user!.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    console.log('Event created successfully:', data)
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(400).json({ 
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update event
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, start_date, end_date, team_a_id, team_b_id } = req.body
    
    // If dates are being updated, validate one-week duration
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays !== 6) {
        return res.status(400).json({ 
          error: 'Event duration must be exactly one week (7 days). End date must be 6 days after start date.' 
        })
      }
    }

    // If teams are being updated, validate they're different
    if (team_a_id && team_b_id && team_a_id === team_b_id) {
      return res.status(400).json({ 
        error: 'Team A and Team B must be different' 
      })
    }

    const { data, error } = await supabase
      .from('events')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('created_by', req.user!.id)
      .select()
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update event' })
  }
})

// Test endpoint to check if delete is working
router.get('/test-delete/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Testing delete for event:', req.params.id)
    console.log('User ID:', req.user!.id)
    
    // Check if the event exists and user owns it
    const { data: event, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id, created_by, name')
      .eq('id', req.params.id)
      .single()
    
    if (fetchError || !event) {
      console.log('Event not found or fetch error:', fetchError)
      return res.status(404).json({ error: 'Event not found' })
    }
    
    console.log('Event found:', event)
    console.log('Event created_by:', event.created_by)
    console.log('User ID:', req.user!.id)
    console.log('IDs match:', event.created_by === req.user!.id)
    
    return res.json({
      event,
      user: req.user,
      canDelete: event.created_by === req.user!.id
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ error: 'Test failed' })
  }
})

// Delete event
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Attempting to delete event:', req.params.id)
    console.log('User ID:', req.user!.id)
    
    // First check if the event exists and user owns it
    const { data: event, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id, created_by')
      .eq('id', req.params.id)
      .single()
    
    if (fetchError || !event) {
      console.log('Event not found or fetch error:', fetchError)
      return res.status(404).json({ error: 'Event not found' })
    }
    
    if (event.created_by !== req.user!.id) {
      console.log('User not authorized to delete this event')
      return res.status(403).json({ error: 'Not authorized to delete this event' })
    }
    
    // Delete the event using supabaseAdmin to bypass RLS
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', req.params.id)
    
    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
    
    console.log('Event deleted successfully')
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

export default router
