'use client'

import { useState, useCallback } from 'react'
import { EmailList }       from '@/components/mail/EmailList'
import { AttachmentList }  from '@/components/mail/AttachmentList'
import { useEmailStore }   from '@/store/emailStore'
import { useSSE }          from '@/hooks/useSSE'           // ← AJOUT
import { Folder }          from '@/types'
import { extractSenderName, formatEmailDate, isEncryptedEmail } from '@/lib/utils'
import { ArrowLeft, Lock } from 'lucide-react'
import { PGPDecryptModal } from '@/components/pgp/PGPDecryptModal'

interface EmailPageLayoutProps {
  folder:       Folder
  emails:       ReturnType<typeof import('@/hooks/useEmails').useEmails>['emails']
  isLoading:    boolean
  totalEmails:  number
  currentPage:  number
  fetchEmails:  (page: number) => void
  toggleStar:   (id: string, starred: boolean) => void
  deleteEmail:  (id: string) => void
  moveEmail:    (id: string, folder: Folder) => void
}

export function EmailPageLayout({
  folder, emails, isLoading, totalEmails, currentPage,
  fetchEmails, toggleStar, deleteEmail, moveEmail,
}: EmailPageLayoutProps) {
  const { selectedEmail, setSelectedEmail } = useEmailStore()
  const [showDecrypt,   setShowDecrypt]   = useState(false)
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null)

  // ── SSE : rafraîchit la liste quand le backend détecte de nouveaux emails ──
  const handleSSENewEmails = useCallback(() => {
    if (folder === 'inbox') {
      fetchEmails(1)
    }
  }, [folder, fetchEmails])

  useSSE({ onNewEmails: handleSSENewEmails, enabled: true })

  // ── Sélection d'un email ───────────────────────────────────────────────────
  const handleSelect = (email: typeof emails[0]) => {
    setSelectedEmail(email)
    setDecryptedBody(null)
  }

  const encrypted = selectedEmail ? isEncryptedEmail(selectedEmail.body_text) : false

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">

      {/* Liste des emails */}
      <div className={`
        ${selectedEmail ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-96 lg:w-[420px]
        border-r border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900 shrink-0
      `}>
        <EmailList
          emails={emails}
          isLoading={isLoading}
          total={totalEmails}
          currentPage={currentPage}
          onPageChange={fetchEmails}
          onStar={toggleStar}
          onDelete={deleteEmail}
          onMove={moveEmail}
          folder={folder}
        />
      </div>

      {/* Détail de l'email */}
      <div className={`
        ${selectedEmail ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden
      `}>
        {selectedEmail ? (
          <>
            {/* En-tête */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 shrink-0">
              <button
                onClick={() => setSelectedEmail(null)}
                className="md:hidden flex items-center gap-2 text-sm text-gray-500 mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {selectedEmail.subject || '(sans objet)'}
              </h2>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {extractSenderName(selectedEmail.from_address).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {extractSenderName(selectedEmail.from_address)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{selectedEmail.from_address}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {formatEmailDate(selectedEmail.created_at)}
                </p>
              </div>

              {encrypted && !decryptedBody && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Chiffré PGP
                  </span>
                  <button
                    onClick={() => setShowDecrypt(true)}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Déchiffrer
                  </button>
                </div>
              )}
            </div>

            {/* Corps de l'email */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                  {decryptedBody ? (
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {decryptedBody}
                    </pre>
                  ) : selectedEmail.body_html ? (
                    <div
                      className="prose dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedEmail.body_text || '(message vide)'}
                    </pre>
                  )}
                </div>

                {selectedEmail.attachment_ids.length > 0 && (
                  <AttachmentList emailId={selectedEmail.id} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✉️</span>
              </div>
              <p className="text-sm text-gray-500">Sélectionnez un email</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal PGP */}
      {showDecrypt && selectedEmail && (
        <PGPDecryptModal
          encryptedMessage={selectedEmail.body_text}
          onDecrypted={(msg) => { setDecryptedBody(msg); setShowDecrypt(false) }}
          onClose={() => setShowDecrypt(false)}
        />
      )}
    </div>
  )
}