/**
 * Server-side only — never import in pages/components.
 * Validates a Supabase JWT by calling the auth REST endpoint directly.
 * Bypasses all Supabase JS client session management issues.
 */
export async function getUserFromToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  if (!token) return null
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_SERVICE_KEY!,
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.id ? { id: data.id, email: data.email ?? '' } : null
  } catch {
    return null
  }
}
