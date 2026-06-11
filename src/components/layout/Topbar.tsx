'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface TopbarProps {
  userName: string
  userRole: UserRole
  onMenuClick: () => void
}

export default function Topbar({ userName, userRole, onMenuClick }: TopbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-10 bg-[#0a0a0a] border-b-4 border-[#FAF33E]">
      {/* Scrolling Marquee Ticker */}
      <div className="bg-[#FAF33E] border-b-2 border-black overflow-hidden py-1">
        <div className="marquee-track flex whitespace-nowrap">
          <span className="text-[10px] font-black text-black uppercase tracking-widest px-8">★ STATUS: DEVELOPMENT UNDERWAY ★ 100% COLLABORATIVE ★ LET&apos;S GO ★ CLIENTHUB PORTAL ACTIVE ★ STATUS: DEVELOPMENT UNDERWAY ★ 100% COLLABORATIVE ★ LET&apos;S GO ★ CLIENTHUB PORTAL ACTIVE ★</span>
          <span className="text-[10px] font-black text-black uppercase tracking-widest px-8">★ STATUS: DEVELOPMENT UNDERWAY ★ 100% COLLABORATIVE ★ LET&apos;S GO ★ CLIENTHUB PORTAL ACTIVE ★ STATUS: DEVELOPMENT UNDERWAY ★ 100% COLLABORATIVE ★ LET&apos;S GO ★ CLIENTHUB PORTAL ACTIVE ★</span>
        </div>
      </div>
      <div className="h-16 px-4 lg:px-8 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Welcome message */}
          <div className="hidden sm:block">
            <p className="text-sm text-gray-500">Welcome back</p>
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Badge variant={userRole === 'admin' ? 'info' : 'default'}>
            {userRole === 'admin' ? 'Admin' : 'Client'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
