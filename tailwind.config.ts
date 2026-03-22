import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0a0e1a',
        card: '#0f1629',
        hover: '#131c35',
        border: '#1e2d4a',
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
        tier: {
          t1: '#10b981',
          t2: '#f59e0b',
          t3: '#6b7280',
          dq: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
