import { createClient } from '@supabase/supabase-js'

// Client admin — côté serveur UNIQUEMENT (API routes)
// Ne jamais importer ce fichier dans une page ou un composant
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
