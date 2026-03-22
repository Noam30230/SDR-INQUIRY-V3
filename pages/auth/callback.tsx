import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/scoring')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: 'var(--primary)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Signing in...</p>
      </div>
    </div>
  )
}
