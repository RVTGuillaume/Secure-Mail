'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useEmailStore } from '@/store/emailStore'
import { api } from '@/lib/api'
import { EmailListResponse } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const [query, setQuery] = useState('')
  const { setEmails, setLoading } = useEmailStore()
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (!debouncedQuery.trim()) return
    const search = async () => {
      setLoading(true)
      try {
        const data = await api.get<EmailListResponse>(
          `/emails/search/?q=${encodeURIComponent(debouncedQuery)}&page=1&per_page=20`
        )
        setEmails(data.emails, data.total)
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [debouncedQuery])

  return (
    <div className="flex-1 flex items-center gap-4 h-full">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white hidden sm:block shrink-0">
        {title}
      </h1>

      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          aria-label="Rechercher des emails"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}