import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import '@/styles/globals.css'

// Clears all session-scoped localStorage caches (called on every sign-out)
function clearSessionCaches() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('inquiry_accounts_cache') || key.startsWith('inquiry_stats_cache')) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // Global auth guard: wipe all caches whenever any sign-out occurs
  // (manual logout, session expiry, logout from another tab, token revocation)
  useEffect(() => {
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearSessionCaches()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>

    const handleStart = () => {
      setProgress(0)
      setVisible(true)
      // Animate from 0 → 80% while loading
      let p = 0
      interval = setInterval(() => {
        p = Math.min(p + Math.random() * 12, 82)
        setProgress(p)
      }, 120)
    }

    const handleDone = () => {
      clearInterval(interval)
      setProgress(100)
      timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleDone)
    router.events.on('routeChangeError', handleDone)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleDone)
      router.events.off('routeChangeError', handleDone)
    }
  }, [router])

  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='28' width='36' height='8' rx='3.6' fill='%237c3aed'/%3E%3Ccircle cx='52' cy='32' r='4.2' fill='%237c3aed'/%3E%3C/svg%3E" />
        <title>Inquiry</title>
      </Head>

      {/* Progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 120ms ease-out',
          boxShadow: '0 0 8px rgba(124,58,237,0.8)',
        }} />
      </div>

      <Component {...pageProps} />
    </>
  )
}
