import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { User } from '../types'

export interface AuthRequest extends Request {
  user?: User
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('Auth middleware - authorization header:', (req.headers as any).authorization)
  
  const token = (req.headers as any).authorization?.replace('Bearer ', '')
  
  if (!token) {
    console.log('No token provided')
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    console.log('Validating token...')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log('Invalid token:', error)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('Token valid, user:', user.id)
    
    // Try to get user profile with admin client to bypass RLS
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('User profile not found, creating new profile...')
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
        })
        .select()
        .single()

      if (createError) {
        console.log('Failed to create user profile:', createError)
        return res.status(500).json({ error: 'Failed to create user profile' })
      }

      profile = newProfile
      console.log('User profile created:', profile)
    } else if (profileError) {
      console.log('Profile error:', profileError)
      return res.status(401).json({ error: 'User profile not found' })
    }

    console.log('User profile found:', profile)
    req.user = profile as User
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}
