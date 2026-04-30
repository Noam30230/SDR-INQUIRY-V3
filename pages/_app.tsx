import type { AppProps } from 'next/app'
import Head from 'next/head'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='28' width='36' height='8' rx='3.6' fill='%237c3aed'/%3E%3Ccircle cx='52' cy='32' r='4.2' fill='%237c3aed'/%3E%3C/svg%3E" />
        <title>Inquiry</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
