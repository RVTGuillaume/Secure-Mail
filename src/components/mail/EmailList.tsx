'use client'

import { EmailResponse, Folder } from '@/types'
import { EmailItem } from './EmailItem'
import { SkeletonList } from './SkeletonList'
import { useEmailStore } from '@/store/emailStore'
import { ChevronLeft, ChevronRight, InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmailListProps {
  emails: EmailResponse[]
  isLoading: boolean
  total: number
  currentPage: number
  onPageChange: (page: number) => void
  onStar: (id: string, starred: boolean) => void
  onDelete: (id: string) => void
  onMove: (id: string, folder: Folder) => void
  folder: Folder
}

export function EmailList({
  emails, isLoading, total, currentPage,
  onPageChange, onStar, onDelete, onMove, folder,
}: EmailListProps) {
  const { selectedEmail, setSelectedEmail } = useEmailStore()

  const totalPages = Math.ceil(total / 20)

  if (isLoading) return <SkeletonList />

  if (!isLoading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <InboxIcon className="w-12 h-12 opacity-30" />
        <p className="text-sm font-medium">Aucun email dans ce dossier</p>
        <p className="text-xs opacity-70">Les nouveaux messages apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nombre de résultats */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {total} message{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Liste des emails">
        {emails.map((email) => (
          <div key={email.id} role="listitem">
            <EmailItem
              email={email}
              isSelected={selectedEmail?.id === email.id}
              onSelect={(e) => setSelectedEmail(e)}
              onStar={onStar}
              onDelete={onDelete}
              onArchive={(id) => onMove(id, 'archive')}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <span className="text-xs text-gray-500">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Page suivante"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}