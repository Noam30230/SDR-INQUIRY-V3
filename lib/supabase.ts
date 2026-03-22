import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Client côté navigateur (pour les pages)
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)

// Client avec service key — contourne le RLS (pour les API routes côté serveur)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Client serveur avec cookie auth (pour les API routes qui ont besoin de l'identité user)
export function getServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerSupabaseClient({ req, res }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })
}
