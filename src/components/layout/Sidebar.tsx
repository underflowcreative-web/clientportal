'use client'

import Link from 'next/link'
import { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  userRole: UserRole
  currentPath: string
  isOpen?: boolean
  onClose?: () => void
}

const icons = {
  grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  uploadCloud: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.438 3.42A3.75 3.75 0 0118 19.5H6.75z" />
    </svg>
  ),
  messageSquare: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443h.166C18.891 16.48 21 14.338 21 11.69V8.25C21 5.58 18.891 3.5 16.238 3.5H7.762C5.109 3.5 3 5.58 3 8.25v3.44z" />
    </svg>
  ),
  fileText: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
}

const clientLinks: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: icons.grid },
  { label: 'Projects', href: '/dashboard/projects', icon: icons.folder },
  { label: 'Timeline', href: '/dashboard/timeline', icon: icons.clock },
  { label: 'Files', href: '/dashboard/files', icon: icons.uploadCloud },
  { label: 'Requests', href: '/dashboard/requests', icon: icons.messageSquare },
  { label: 'Invoices', href: '/dashboard/invoices', icon: icons.fileText },
]

const adminLinks: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: icons.grid },
  { label: 'Clients', href: '/admin/clients', icon: icons.users },
  { label: 'Projects', href: '/admin/projects', icon: icons.folder },
  { label: 'Timeline', href: '/admin/timeline', icon: icons.clock },
  { label: 'Files', href: '/admin/files', icon: icons.uploadCloud },
  { label: 'Requests', href: '/admin/requests', icon: icons.messageSquare },
  { label: 'Invoices', href: '/admin/invoices', icon: icons.fileText },
]

function isActive(currentPath: string, href: string): boolean {
  if (href === '/dashboard' || href === '/admin') {
    return currentPath === href
  }
  return currentPath.startsWith(href)
}

export default function Sidebar({ userRole, currentPath, isOpen = false, onClose }: SidebarProps) {
  const links = userRole === 'admin' ? adminLinks : clientLinks

  const sidebarContent = (
    <div className="w-64 bg-[#FF007F] border-r-4 border-black h-screen flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b-4 border-black">
        <span className="text-xl font-black text-white uppercase tracking-widest" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '2px 2px 0px #000' }}>⬢ CLIENTHUB</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(currentPath, link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-black uppercase tracking-wider transition-all duration-150 border-2 ${
                active
                  ? 'bg-black text-[#FAF33E] border-[#FAF33E] shadow-[3px_3px_0px_#FAF33E]'
                  : 'text-white border-transparent hover:bg-black/30 hover:border-white hover:shadow-[2px_2px_0px_#000]'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t-4 border-black">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black border-2 border-white flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block px-2 py-0.5 border-2 border-black text-xs font-black uppercase ${
                userRole === 'admin'
                  ? 'bg-[#FAF33E] text-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-black shadow-[2px_2px_0px_#000]'
              }`}
            >
              {userRole === 'admin' ? 'Admin' : 'Client'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-150"
            onClick={onClose}
          />
          {/* Sidebar panel */}
          <div className="fixed inset-y-0 left-0 z-50 transition-transform duration-150">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
