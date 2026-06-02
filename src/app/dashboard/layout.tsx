'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { User } from '@supabase/supabase-js'

interface UserContextType {
  user: User
  profile: Profile
  isAdmin: boolean
}

const UserContext = createContext<UserContextType | null>(null)

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a DashboardLayout')
  }
  return context
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profileData) {
        router.push('/login')
        return
      }

      setUser(authUser)
      setProfile(profileData as Profile)
      setLoading(false)
    }

    fetchUserProfile()
  }, [router])

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, profile, isAdmin: profile.role === 'admin' }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          userRole={profile.role}
          currentPath={pathname}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            userName={profile.name}
            userRole={profile.role}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
