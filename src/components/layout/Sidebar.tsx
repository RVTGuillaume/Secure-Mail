'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Inbox, Send, FileText, Trash2, Archive,
  Settings, LogOut, Mail, RefreshCw, PenSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmailStore } from '@/store/emailStore'
import { useAuthStore } from '@/store/authStore'
import { authStorage } from '@/lib/auth'
import { Folder } from '@/types'
import { useState } from 'react'
import { api } from '@/lib/api'

interface NavItem {
  label: string
  href: string
  folder: Folder
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Boîte de réception', href: '/inbox', folder: 'inbox', icon: <Inbox className="w-4 h-4" /> },
  { label: 'Envoyés', href: '/sent', folder: 'sent', icon: <Send className="w-4 h-4" /> },
  { label: 'Brouillons', href: '/drafts', folder: 'drafts', icon: <FileText className="w-4 h-4" /> },
  { label: 'Corbeille', href: '/trash', folder: 'trash', icon: <Trash2 className="w-4 h-4" /> },
  { label: 'Archives', href: '/archive', folder: 'archive', icon: <Archive className="w-4 h-4" /> },
]

interface SidebarProps {
  onCompose: () => void
  onSync?: () => void  // ← nouveau
}

export function Sidebar({ onCompose, onSync }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCounts } = useEmailStore()
  const { user, logout } = useAuthStore()
  const [syncing, setSyncing] = useState(false)

  const handleLogout = () => {
    authStorage.clearTokens()
    logout()
    router.replace('/login')
  }

const handleSync = async () => {
  setSyncing(true)
  try {
    await api.post('/emails/fetch')
    // Attendre 3s que le fetch IMAP se termine en background
    await new Promise((r) => setTimeout(r, 3000))
    onSync?.()
  } catch (err) {
    console.error('Sync failed', err)
  } finally {
    setSyncing(false)
  }
}

  const getInitials = () => {
    if (!user) return '?'
    if (user.full_name) return user.full_name.slice(0, 2).toUpperCase()
    return user.username.slice(0, 2).toUpperCase()
  }

  return (
    <aside className="w-64 min-h-screen bg-[#1e1b4b] flex flex-col select-none">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">SecureMail</span>
      </div>

      {/* Bouton Nouveau message */}
      <div className="px-4 py-4">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-900/40"
          aria-label="Nouveau message"
        >
          <PenSquare className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5" role="navigation" aria-label="Dossiers de messagerie">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const unread = unreadCounts[item.folder] ?? 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={cn(isActive ? 'text-white' : 'text-indigo-300')}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {unread > 0 && (
                <span className="bg-indigo-400 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sync + Paramètres + Profil */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white transition-all duration-150 disabled:opacity-50"
          aria-label="Synchroniser les emails"
        >
          <RefreshCw className={cn('w-4 h-4 text-indigo-300', syncing && 'animate-spin')} />
          {syncing ? 'Synchronisation...' : 'Synchroniser'}
        </button>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            pathname === '/settings'
              ? 'bg-indigo-600 text-white'
              : 'text-indigo-200 hover:bg-white/10 hover:text-white'
          )}
        >
          <Settings className="w-4 h-4 text-indigo-300" />
          Paramètres
        </Link>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-white/5">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.full_name || user?.username || '...'}
            </p>
            <p className="text-indigo-300 text-xs truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-indigo-300 hover:text-red-400 transition-colors"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}