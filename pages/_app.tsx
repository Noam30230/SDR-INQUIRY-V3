import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const [displayedComponent, setDisplayedComponent] = useState<typeof Component>(Component)
  const [displayedProps, setDisplayedProps] = useState(pageProps)

  useEffect(() => {
    const handleStart = () => setVisible(false)
    const handleDone = () => {
      setDisplayedComponent(() => Component)
      setDisplayedProps(pageProps)
      setVisible(true)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleDone)
    router.events.on('routeChangeError', handleDone)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleDone)
      router.events.off('routeChangeError', handleDone)
    }
  }, [router, Component, pageProps])

  // Sync on initial load
  useEffect(() => {
    setDisplayedComponent(() => Component)
    setDisplayedProps(pageProps)
  }, [Component, pageProps])

  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='28' width='36' height='8' rx='3.6' fill='%237c3aed'/%3E%3Ccircle cx='52' cy='32' r='4.2' fill='%237c3aed'/%3E%3C/svg%3E" />
        <title>Inquiry</title>
      </Head>
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 180ms ease',
          height: '100%',
        }}
      >
        <displayedComponent {...displayedProps} />
      </div>
    </>
  )
}
