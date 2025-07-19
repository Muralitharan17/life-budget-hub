import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && 
                           supabaseAnonKey !== 'placeholder-key' &&
                           supabaseUrl.includes('supabase.co')

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signOut: async () => {
    if (!hasValidCredentials) {
      return { error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    if (!hasValidCredentials) {
      return { 
        user: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!hasValidCredentials) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}