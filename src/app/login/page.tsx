'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row relative overflow-hidden">
      {/* Left Column: Maximalist Collage Poster Art */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between overflow-hidden">
        {/* Full collage background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/maximalist_collage_bg.png')" }}
        />
        {/* Subtle dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Top: Tape label + Logo */}
        <div className="relative z-10 p-6">
          <div className="inline-block bg-[#FAF33E] border-[3px] border-black px-4 py-1 font-black text-black text-xs uppercase tracking-widest mb-4" style={{ transform: 'rotate(-3deg)', boxShadow: '3px 3px 0px #000' }}>
            HIGH IMPACT // RADICAL DESIGN
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 bg-[#00FF66] border-[3px] border-black flex items-center justify-center" style={{ transform: 'rotate(12deg)', boxShadow: '2px 2px 0px #000' }}>
              <span className="text-sm font-black">⬢</span>
            </div>
            <span className="font-black text-white text-sm uppercase tracking-wider" style={{ textShadow: '2px 2px 0px #000, -1px -1px 0px #000' }}>CLIENTHUB</span>
          </div>
        </div>

        {/* Center: Big Bold Message */}
        <div className="relative z-10 flex-1 flex items-center px-8">
          <div>
            <div className="bg-[#FF007F] border-[4px] border-black inline-block px-6 py-5 mb-4" style={{ boxShadow: '8px 8px 0px #000', transform: 'rotate(-1.5deg)' }}>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase leading-[0.95] tracking-tight" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '3px 3px 0px #000' }}>
                COLLABORATE,<br/>CREATE,<br/>ELEVATE.
              </h1>
            </div>
            <div className="bg-[#00FF66] border-[3px] border-black inline-block px-4 py-2 mt-2" style={{ boxShadow: '5px 5px 0px #000', transform: 'rotate(1deg)' }}>
              <p className="text-[11px] text-black font-black uppercase tracking-wider leading-relaxed">
                Welcome to your premium interactive workspace.<br/>
                Track real-time progress, upload files, and<br/>
                collaborate in comfort.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Sticker tags + Footer */}
        <div className="relative z-10 px-8 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#FAF33E] border-[2px] border-black px-3 py-1 text-[9px] font-black text-black uppercase shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(-3deg)' }}>POWER UP ⚡</span>
            <span className="bg-[#00F0FF] border-[2px] border-black px-3 py-1 text-[9px] font-black text-black uppercase shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(2deg)' }}>NO RULES</span>
            <span className="bg-[#FF6B00] border-[2px] border-black px-3 py-1 text-[9px] font-black text-white uppercase shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(-1deg)' }}>VISUAL DISRUPTION</span>
          </div>
          <p className="text-white font-black text-sm uppercase tracking-widest" style={{ textShadow: '2px 2px 0px #000' }}>
            EST. 1988 // LONDON / NYC
          </p>
          <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-1" style={{ textShadow: '1px 1px 0px #000' }}>
            © 2026 UNDERFLOW CREATIVE
          </p>
          <p className="text-xl font-black text-white uppercase tracking-widest mt-2" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '3px 3px 0px #000' }}>
            ★ REVOLUTION ★<br/>VISUAL DISRUPTION
          </p>
        </div>
      </div>

      {/* Right Column: Login Form with dot-matrix overlay */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#f5f5f0] relative z-10">
        {/* Dot matrix pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #bbb 1px, transparent 1px)', backgroundSize: '14px 14px', opacity: 0.35 }} />
        
        {/* Corner tape decoration */}
        <div className="absolute top-5 right-5 bg-[#00FF66] border-[2px] border-black px-3 py-1 text-[8px] font-black text-black uppercase shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(8deg)' }}>
          CONFIDENTIAL ★
        </div>

        {/* Login Card */}
        <div className="bg-white border-[4px] border-black p-8 md:p-10 w-full max-w-md relative" style={{ boxShadow: '8px 8px 0px #000' }}>
          {/* Form Header */}
          <div className="text-center mb-8">
            {/* Icon */}
            <div className="w-14 h-14 bg-[#FAF33E] border-[3px] border-black mx-auto mb-4 flex items-center justify-center shadow-[3px_3px_0px_#000]" style={{ transform: 'rotate(6deg)' }}>
              <span className="text-2xl">⬢</span>
            </div>
            <h1 className="text-2xl font-black text-black uppercase tracking-wider" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
              CLIENT PORTAL
            </h1>
            {/* Neon badge */}
            <div className="inline-block bg-[#FF007F] border-[2px] border-black px-3 py-0.5 mt-2 shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(-1deg)' }}>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">SECURE SIGN IN ★</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white border-[3px] border-black px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#FF007F] focus:ring-0 shadow-[3px_3px_0px_#000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white border-[3px] border-black px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#FF007F] focus:ring-0 shadow-[3px_3px_0px_#000]"
              />
            </div>

            {error && (
              <div className="bg-[#FF6B00] border-[3px] border-black text-white text-xs font-bold p-3 uppercase shadow-[3px_3px_0px_#000]">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-black text-white font-black py-3.5 text-sm uppercase tracking-widest border-[3px] border-black hover:bg-[#FF007F] hover:text-white active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer shadow-[4px_4px_0px_#FF007F]"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN TO PORTAL'}
            </button>
          </form>

          {/* Bottom tape decoration */}
          <div className="absolute -bottom-3 -right-3 bg-[#FAF33E] border-[2px] border-black px-3 py-1 text-[8px] font-black text-black uppercase shadow-[2px_2px_0px_#000]" style={{ transform: 'rotate(5deg)' }}>
            ACCESS ONLY ★
          </div>
        </div>
      </div>
    </div>
  )
}
