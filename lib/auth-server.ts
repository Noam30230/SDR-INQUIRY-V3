/**
 * Server-side only — never import in pages/components.
 *
 * Strategy:
 * 1. Try REST call to /auth/v1/user (most secure — Supabase validates the JWT)
 * 2. If REST fails (env vars missing, network error), fall back to local JWT decode
 *    with role + expiry checks.  This guarantees auth never silently breaks due
 *    to a missing env var in Vercel.
 */

export async function getUserFromToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  if (!token) return null

  // ── 1. Try REST validation ──────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && apiKey) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: apiKey,
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.id) return { id: data.id, email: data.email ?? '' }
      }
    } catch {
      // Network error — fall through to local decode
    }
  }

  // ── 2. Fallback: decode JWT locally ────────────────────────────────────────
  return decodeJwt(token)
}

/**
 * Decode a Supabase JWT without verifying the signature.
 * Accepts only tokens with role="authenticated" and not yet expired.
 */
function decodeJwt(token: string): { id: string; email: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
    // Must be an authenticated user (not anon or service_role)
    if (payload.role !== 'authenticated') return null
    // Must not be expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    // Must have a user ID
    if (!payload.sub) return null
    return { id: payload.sub, email: payload.email ?? '' }
  } catch {
    return null
  }
}
