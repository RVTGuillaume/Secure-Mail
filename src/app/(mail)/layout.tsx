'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ComposeModal } from '@/components/mail/ComposeModal'
import { useAuth } from '@/hooks/useAuth'
import { useEmailStore } from '@/store/emailStore'
import { api } from '@/lib/api'
import { EmailListResponse } from '@/types'
import { Menu, X } from 'lucide-react'

const FOLDER_TITLES: Record<string, string> = {
  '/inbox': 'Boîte de réception',
  '/sent': 'Envoyés',
  '/drafts': 'Brouillons',
  '/trash': 'Corbeille',
  '/archive': 'Archives',
  '/settings': 'Paramètres',
}

export default function MailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading } = useAuth()
  const [composeOpen, setComposeOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { setEmails, currentFolder } = useEmailStore()

  const title = Object.entries(FOLDER_TITLES).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? 'SecureMail'

  const handleSync = async () => {
    try {
      await api.post('/emails/fetch')
      await new Promise((r) => setTimeout(r, 3000))
      const data = await api.get<EmailListResponse>(
        `/emails/${currentFolder}?page=1&per_page=20`
      )
      setEmails(data.emails, data.total)
    } catch (err) {
      console.error('Sync error', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixe sur desktop, drawer sur mobile */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shrink-0
      `}>
        <Sidebar
          onCompose={() => { setComposeOpen(true); setSidebarOpen(false) }}
          onSync={handleSync}
        />
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header avec bouton menu mobile */}
        <div className="flex items-center h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Header title={title} />
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {composeOpen && (
        <ComposeModal onClose={() => setComposeOpen(false)} />
      )}
    </div>
  )
}