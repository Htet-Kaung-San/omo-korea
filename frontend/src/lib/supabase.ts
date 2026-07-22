import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const apiMode = import.meta.env.VITE_API_MODE ?? 'mock'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function createSupabaseClient(): SupabaseClient | null {
  if (apiMode !== 'real') return null
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (supabaseUrl.includes('placeholder')) return null

  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

export const supabase = createSupabaseClient()

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
