import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type Match = {
  id?: number
  date: string
  tournament: string
  organization: string
  belt: string
  age_division: string
  weight_class: string
  gi_nogi: string
  division_type: string
  opponent: string
  result: 'Win' | 'Loss'
  method: string
  score?: string
  medal?: string
  created_at?: string
}

export type Profile = {
  id: string
  email: string
  role: 'admin' | 'viewer'
  display_name?: string
  created_at?: string
}

export type UserRole = {
  id: string
  email: string
  role: 'admin' | 'viewer'
  name?: string
  created_at?: string
}
