'use client'

import { EmailResponse } from '@/types'
import { cn, formatEmailDate, extractEmailPreview, extractSenderName, isEncryptedEmail } from '@/lib/utils'
import { Star, Trash2, Archive, Lock } from 'lucide-react'

interface EmailItemProps {
  email: EmailResponse
  isSelected: boolean
  onSelect: (email: EmailResponse) => void
  onStar: (id: string, starred: boolean) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function EmailItem({ email, isSelected, onSelect, onStar, onDelete, onArchive }: EmailItemProps) {
  const encrypted = isEncryptedEmail(email.body_text)
  const senderName = extractSenderName(email.from_address)
  const preview = encrypted ? '🔒 Message chiffré PGP' : extractEmailPreview(email.body_text)

  const initials = senderName.slice(0, 2).toUpperCase()

  const avatarColors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500',
    'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  ]
  const colorIndex = senderName.charCodeAt(0) % avatarColors.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(email)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(email)}
      aria-selected={isSelected}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-100 dark:border-gray-800',
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-2 border-l-indigo-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        !email.is_read && !isSelected && 'bg-white dark:bg-gray-900'
      )}
    >
      {/* Avatar */}
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5', avatarColors[colorIndex])}>
        {initials}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Indicateur non lu */}
          {!email.is_read && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" aria-label="Non lu" />
          )}
          <span className={cn(
            'text-sm truncate flex-1',
            email.is_read ? 'text-gray-600 dark:text-gray-400 font-normal' : 'text-gray-900 dark:text-white font-semibold'
          )}>
            {senderName}
          </span>
          <span className="text-xs text-gray-400 shrink-0 ml-auto">
            {formatEmailDate(email.created_at)}
          </span>
        </div>

        <p className={cn(
          'text-sm truncate mb-0.5',
          email.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200 font-medium'
        )}>
          {email.subject || '(sans objet)'}
        </p>

        <div className="flex items-center gap-2">
          {encrypted && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">
              <Lock className="w-3 h-3" /> Chiffré
            </span>
          )}
          <p className="text-xs text-gray-400 truncate flex-1">{preview}</p>

          {email.attachment_ids.length > 0 && (
            <span className="text-xs text-gray-400 shrink-0">📎 {email.attachment_ids.length}</span>
          )}
        </div>
      </div>

      {/* Actions rapides (visibles au survol) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onStar(email.id, !email.is_starred) }}
          className={cn('p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors', email.is_starred ? 'text-amber-400' : 'text-gray-400')}
          aria-label={email.is_starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          title={email.is_starred ? 'Retirer des favoris' : 'Marquer comme favori'}
        >
          <Star className={cn('w-3.5 h-3.5', email.is_starred && 'fill-amber-400')} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onArchive(email.id) }}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Archiver"
          title="Archiver"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(email.id) }}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Supprimer"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}