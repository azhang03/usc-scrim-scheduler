import { Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name')
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' })
  }
})

export default router
