'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Fetch profile to determine role
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Unable to retrieve user information.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F2] flex flex-col md:flex-row relative overflow-hidden">
      {/* Left Column: Premium Wave Art & Welcome Quote (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: "url('/pastel_premium_bg.png')" }}
        />
        {/* Subtle Warm Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F2]/60 via-[#FAF6F2]/10 to-transparent" />
        <div className="absolute inset-0 bg-white/5" />

        {/* Top: Logo & Geometric Icon */}
        <div className="relative z-10 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D7897F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            <line x1="12" y1="22" x2="12" y2="15.5"/>
            <polyline points="22 8.5 12 15.5 2 8.5"/>
            <polyline points="2 15.5 12 8.5 22 15.5"/>
            <line x1="12" y1="2" x2="12" y2="8.5"/>
          </svg>
          <span className="brand-font text-lg font-bold text-[#3A2E2C] tracking-wider">ClientHub</span>
        </div>

        {/* Center: Majestic Quote */}
        <div className="relative z-10 space-y-4 max-w-md">
          <p className="brand-font text-3xl md:text-4xl text-[#3A2E2C] font-bold leading-tight tracking-wide drop-shadow-sm">
            Collaborate, Create, and Elevate Your Brand.
          </p>
          <div className="w-16 h-0.5 bg-[#D7897F]/50" />
          <p className="text-sm text-[#7E6E6A] leading-relaxed font-light">
            Welcome to your premium project workspace. Track real-time progress, upload files, and collaborate in comfort.
          </p>
        </div>

        {/* Bottom: Footer */}
        <div className="relative z-10 text-xs text-[#7E6E6A]/75 tracking-wider">
          © 2026 Underflow Creative. All rights reserved.
        </div>
      </div>

      {/* Right Column: Premium Login Form Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#FAF6F2] z-10 relative">
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-[#EADFD9] w-full max-w-md shadow-[0_8px_30px_rgb(99,152,169,0.08)] relative">
          {/* Subtle brand highlight at top of card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D7897F] to-transparent" />

          {/* Form Header */}
          <div className="text-center mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#D7897F" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="mx-auto mb-4"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
              <line x1="12" y1="22" x2="12" y2="15.5"/>
              <polyline points="22 8.5 12 15.5 2 8.5"/>
              <polyline points="2 15.5 12 8.5 22 15.5"/>
              <line x1="12" y1="2" x2="12" y2="8.5"/>
            </svg>
            <h1 className="text-2xl font-bold text-[#3A2E2C] tracking-wider">
              CLIENT PORTAL
            </h1>
            <p className="text-xs text-[#6398A9] font-semibold uppercase tracking-widest mt-1">
              Sign In to Your Workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="text-red-500 text-xs bg-red-50 border border-red-200 p-3 rounded-md mt-2 text-center font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-6 bg-[#6398A9] hover:bg-[#D7897F] text-white font-semibold py-3 rounded-lg shadow-[0_4px_14px_rgba(99,152,169,0.3)] hover:shadow-[0_4px_14px_rgba(215,137,127,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer"
            >
              {loading ? 'Signing In...' : 'Sign In to Portal'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
