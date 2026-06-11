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
      {/* Left Column: Wild Collage Poster */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF007F 0%, #FF6B00 30%, #FAF33E 60%, #00FF66 80%, #00F0FF 100%)' }}>
        {/* Overlay pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        
        {/* Diagonal tape decorations */}
        <div className="absolute top-4 left-4 bg-[#FAF33E] border-[3px] border-black px-4 py-1 font-black text-black text-xs uppercase tracking-widest" style={{ transform: 'rotate(-5deg)', boxShadow: '3px 3px 0px #000' }}>
          HIGH IMPACT // RADICAL DESIGN
        </div>
        
        <div className="absolute top-16 left-4 flex items-center gap-2 z-10">
          <div className="w-6 h-6 bg-[#00FF66] border-[3px] border-black" style={{ transform: 'rotate(12deg)' }} />
          <span className="font-black text-black text-sm uppercase tracking-wider drop-shadow-[2px_2px_0px_rgba(255,255,255,0.5)]">⬢ CLIENTHUB</span>
        </div>

        {/* Center: Big Bold Message */}
        <div className="relative z-10 flex-1 flex items-center px-12">
          <div>
            <div className="bg-[#FF007F] border-[4px] border-black inline-block px-6 py-4 mb-4" style={{ boxShadow: '6px 6px 0px #000', transform: 'rotate(-1deg)' }}>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase leading-none tracking-tight" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '3px 3px 0px #000' }}>
                COLLABORATE,<br/>CREATE,<br/>ELEVATE.
              </h1>
            </div>
            <div className="bg-[#00FF66] border-[3px] border-black inline-block px-4 py-2 mt-2" style={{ boxShadow: '4px 4px 0px #000', transform: 'rotate(1deg)' }}>
              <p className="text-xs text-black font-black uppercase tracking-wider">
                Welcome to your premium interactive workspace.<br/>
                Track real-time progress, upload files, and<br/>
                collaborate in comfort.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom decorative elements */}
        <div className="relative z-10 px-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#FAF33E] border-[2px] border-black px-3 py-1 text-[10px] font-black text-black uppercase" style={{ transform: 'rotate(-2deg)' }}>POWER UP ⚡</span>
            <span className="bg-[#00F0FF] border-[2px] border-black px-3 py-1 text-[10px] font-black text-black uppercase" style={{ transform: 'rotate(2deg)' }}>NO RULES</span>
          </div>
          <p className="text-black font-black text-sm uppercase tracking-widest" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}>
            EST. 1988 // LONDON / NYC
          </p>
          <p className="text-[10px] text-black/70 font-bold uppercase tracking-wider mt-1">
            © 2026 UNDERFLOW CREATIVE
          </p>
          <p className="text-xl font-black text-black uppercase tracking-widest mt-2" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '2px 2px 0px rgba(255,255,255,0.3)' }}>
            ★ REVOLUTION ★<br/>VISUAL DISRUPTION
          </p>
        </div>
      </div>

      {/* Right Column: Login Form with dot-matrix */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#f5f5f0] relative z-10">
        {/* Dot matrix overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)', backgroundSize: '14px 14px', opacity: 0.4 }} />
        
        {/* Corner tape */}
        <div className="absolute top-4 right-4 bg-[#00FF66] border-[2px] border-black px-3 py-1 text-[8px] font-black text-black uppercase" style={{ transform: 'rotate(8deg)', boxShadow: '2px 2px 0px #000' }}>
          CONFIDENTIAL ★
        </div>

        <div className="bg-white border-[4px] border-black p-8 md:p-10 w-full max-w-md relative" style={{ boxShadow: '8px 8px 0px #000' }}>
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#FAF33E] border-[3px] border-black mx-auto mb-4 flex items-center justify-center" style={{ boxShadow: '3px 3px 0px #000', transform: 'rotate(6deg)' }}>
              <span className="text-xl">⬢</span>
            </div>
            <h1 className="text-2xl font-black text-black uppercase tracking-wider" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
              CLIENT PORTAL
            </h1>
            <div className="inline-block bg-[#FF007F] border-[2px] border-black px-3 py-0.5 mt-2" style={{ boxShadow: '2px 2px 0px #000', transform: 'rotate(-1deg)' }}>
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
                className="w-full bg-white border-[3px] border-black px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#FF007F] focus:ring-0" 
                style={{ boxShadow: '3px 3px 0px #000' }}
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
                className="w-full bg-white border-[3px] border-black px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#FF007F] focus:ring-0"
                style={{ boxShadow: '3px 3px 0px #000' }}
              />
            </div>

            {error && (
              <div className="bg-[#FF6B00] border-[3px] border-black text-white text-xs font-bold p-3 uppercase" style={{ boxShadow: '3px 3px 0px #000' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-black text-white font-black py-3.5 text-sm uppercase tracking-widest border-[3px] border-black hover:bg-[#FF007F] hover:text-white active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              style={{ boxShadow: '4px 4px 0px #FF007F' }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN TO PORTAL'}
            </button>
          </form>

          {/* Bottom tape */}
          <div className="absolute -bottom-3 -right-3 bg-[#FAF33E] border-[2px] border-black px-3 py-1 text-[8px] font-black text-black uppercase" style={{ transform: 'rotate(5deg)', boxShadow: '2px 2px 0px #000' }}>
            ACCESS ONLY ★
          </div>
        </div>
      </div>
    </div>
  )
}
