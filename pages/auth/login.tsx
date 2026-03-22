import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

const FEATURES = [
  { icon: '🎯', title: 'AI-powered scoring', desc: 'T1/T2/T3/DQ tiering in seconds using 7 data sources' },
  { icon: '⚡', title: 'Full tech stack detection', desc: 'Cloud, DevOps, Monitoring, Languages — auto-detected' },
  { icon: '🌐', title: 'Web quality analysis', desc: 'Site quality, hosting provider, job postings extracted' },
  { icon: '📰', title: 'Real-time signals', desc: 'Funding rounds, press coverage, hiring signals' },
]

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signin') {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError("Identifiants incorrects. Pas encore de compte ? Clique sur Sign up.")
        } else {
          setError(error.message)
        }
      } else {
        router.replace('/scoring')
      }
    } else {
      const { error } = await supabaseBrowser.auth.signUp({ email, password })
      if (error) {
        if (error.message.includes('already registered')) {
          setError("Cet email a déjà un compte. Clique sur Log in.")
        } else {
          setError(error.message)
        }
      } else {
        setSuccess("Compte créé ! Tu peux maintenant te connecter.")
        setMode('signin')
        setPassword('')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* LEFT — Marketing */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-14 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Account Scorer</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
              by Noam Ramillon
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            <span className="text-white">Score your accounts.</span><br />
            <span style={{ color: '#7c3aed' }}>Call the right ones.</span>
          </h1>
          <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
            AI-powered ICP scoring for Datadog SDR. Stop guessing, start prioritizing.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
            {[
              { value: '7', label: 'data sources' },
              { value: '<60s', label: 'per account' },
              { value: 'T1/T2/T3/DQ', label: 'tiering system' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3.5">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="w-full lg:w-[540px] flex flex-col justify-center px-8 lg:px-14"
        style={{ background: '#0c1020', borderLeft: '1px solid var(--border)' }}>

        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Log in to your workspace' : 'Start scoring your accounts'}
          </p>

          {/* Toggle Log in / Sign up */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
                style={{
                  background: mode === m ? 'var(--primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'signin' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@datadoghq.com"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg text-sm"
                style={{ color: '#6ee7b7', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                ✓ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              {loading
                ? (mode === 'signin' ? 'Connexion...' : 'Création...')
                : (mode === 'signin' ? 'Log in to Account Scorer →' : 'Create my account →')}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Built by <span className="font-semibold" style={{ color: '#7c3aed' }}>Noam Ramillon</span> · Datadog SDR 🐶
          </p>
        </div>
      </div>
    </div>
  )
}
