import type { NextApiRequest, NextApiResponse } from 'next'

// Temporary diagnostic endpoint — DELETE after use
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Test auth call with a dummy token to see the real error
  let authTestResult = 'not tested'
  if (supabaseUrl && (serviceKey || anonKey)) {
    const apiKey = serviceKey || anonKey
    try {
      const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: 'Bearer dummy',
          apikey: apiKey!,
        },
      })
      const body = await r.json()
      authTestResult = `status=${r.status} body=${JSON.stringify(body)}`
    } catch (e: unknown) {
      authTestResult = `fetch error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return res.status(200).json({
    SUPABASE_URL: supabaseUrl ? `SET → ${supabaseUrl}` : '⚠️ MISSING',
    ANON_KEY: anonKey
      ? `SET → ref=${extractRef(anonKey)} role=${extractRole(anonKey)}`
      : '⚠️ MISSING',
    SERVICE_KEY: serviceKey
      ? `SET → ref=${extractRef(serviceKey)} role=${extractRole(serviceKey)}`
      : '⚠️ MISSING',
    authEndpointTest: authTestResult,
  })
}

function extractRef(jwt: string) {
  try {
    const p = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    return p.ref
  } catch { return '?' }
}
function extractRole(jwt: string) {
  try {
    const p = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    return p.role
  } catch { return '?' }
}
