import { createClient } from '@supabase/supabase-js'

// Client côté navigateur uniquement (pages / composants)
// Utilise uniquement des variables NEXT_PUBLIC_ disponibles côté client
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
