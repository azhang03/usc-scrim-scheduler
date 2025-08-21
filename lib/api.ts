import { supabase } from './supabase'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  return headers
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders()
  console.log(`Making request to: ${API_BASE_URL}${path}`)
  console.log('Headers:', headers)
  console.log('Options:', options)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
  
  console.log('Response status:', response.status)
  console.log('Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    let errorData
    try { 
      errorData = await response.json(); 
      console.log('Error response:', errorData); 
    }
    catch (e) { 
      errorData = { error: 'Network error' }; 
      console.log('Failed to parse error response:', e); 
    }
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null
  }
  
  return response.json()
}
