'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { User } from '@supabase/supabase-js'
import BirdAssistant from '@/components/ui/BirdAssistant'

interface AdminContextType {
  user: User
  profile: Profile
  isAdmin: boolean
}

const AdminUserContext = createContext<AdminContextType | null>(null)

export function useAdminUser(): AdminContextType {
  const context = useContext(AdminUserContext)
  if (!context) {
    throw new Error('useAdminUser must be used within an AdminLayout')
  }
  return context
}

// Alias for consistency with dashboard layout imports
export const useUser = useAdminUser

export default function AdminLayout({ children }: { children: ReactNode }) {
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

      setUser(authUser)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profileData) {
        console.warn('Admin profile fetch failed:', error)
        setProfile(null)
        setLoading(false)
        return
      }

      // Enforce admin role
      if ((profileData as Profile).role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData as Profile)
      setLoading(false)
    }

    fetchUserProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Database Access Denied or Profile Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            We logged you in, but could not read your profile from the database. 
            This is usually because database table permissions need to be granted in Supabase.
          </p>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 cursor-pointer"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminUserContext.Provider value={{ user, profile, isAdmin: true }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          userRole="admin"
          currentPath={pathname}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            userName={profile.name}
            userRole="admin"
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-y-auto">
            {children}
          </main>
        </div>
        
        {/* Floating Royal Scribe AI Assistant */}
        <BirdAssistant />
      </div>
    </AdminUserContext.Provider>
  )
}
