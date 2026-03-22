import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Client côté navigateur (pages / composants)
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)

// Client admin côté serveur uniquement (API routes) — contourne le RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
