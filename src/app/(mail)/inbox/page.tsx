'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEmails } from '@/hooks/useEmails'
import { useSSE } from '@/hooks/useSSE'
import { EmailList } from '@/components/mail/EmailList'
import { useEmailStore } from '@/store/emailStore'
import { PGPDecryptModal } from '@/components/pgp/PGPDecryptModal'
import { isEncryptedEmail, extractSenderName, formatEmailDate } from '@/lib/utils'
import { Lock, Star, Trash2, Archive, ArrowLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AttachmentList } from '@/components/mail/AttachmentList'

export default function InboxPage() {
  const {
    emails, isLoading, totalEmails, currentPage,
    fetchEmails, onSSENewEmails,  // ✅ corrigé : onSSENewEmails au lieu de syncAndRefresh
    markRead, toggleStar, deleteEmail, moveEmail,
  } = useEmails('inbox')

  const { setSelectedEmail, selectedEmail } = useEmailStore()
  const [showDecrypt, setShowDecrypt] = useState(false)
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    setDecryptedBody(null)
    setShowDecrypt(false)
  }, [selectedEmail?.id])

  // SSE — notifications temps réel
  useSSE({
    enabled: true,
    onNewEmails: useCallback((data) => {
      if (data.new_count && data.new_count > 0) {
        setNotification(
          `${data.new_count} nouveau${data.new_count > 1 ? 'x' : ''} message${data.new_count > 1 ? 's' : ''}`
        )
        onSSENewEmails()  // ✅ corrigé
        setTimeout(() => setNotification(null), 4000)
      }
    }, [onSSENewEmails]),  // ✅ dépendance corrigée
  })

  const handleSelect = async (email: typeof emails[0]) => {
    setSelectedEmail(email)
    if (!email.is_read) await markRead(email.id, true)
  }

  const encrypted = selectedEmail ? isEncryptedEmail(selectedEmail.body_text) : false

  return (
    <div className="h-full flex overflow-hidden relative">

      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-bounce">
          <Bell className="w-4 h-4" />
          {notification}
        </div>
      )}

      <div className={`
        ${selectedEmail ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-80 lg:w-96 xl:w-[420px]
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
          folder="inbox"
        />
      </div>

      <div className={`
        ${selectedEmail ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden
        min-w-0
      `}>
        {selectedEmail ? (
          <>
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 shrink-0">
              <button
                onClick={() => setSelectedEmail(null)}
                className="md:hidden flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-4 -ml-1"
                aria-label="Retour à la liste"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight flex-1 min-w-0 break-words">
                  {selectedEmail.subject || '(sans objet)'}
                </h2>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => toggleStar(selectedEmail.id, !selectedEmail.is_starred)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedEmail.is_starred
                        ? 'text-amber-400'
                        : 'text-gray-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                    aria-label={selectedEmail.is_starred ? 'Retirer des favoris' : 'Marquer comme favori'}
                    title={selectedEmail.is_starred ? 'Retirer des favoris' : 'Favori'}
                  >
                    <Star className={`w-4 h-4 ${selectedEmail.is_starred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => { moveEmail(selectedEmail.id, 'archive'); setSelectedEmail(null) }}
                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    aria-label="Archiver"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { deleteEmail(selectedEmail.id); setSelectedEmail(null) }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 min-w-0">
                <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {extractSenderName(selectedEmail.from_address).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {extractSenderName(selectedEmail.from_address)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedEmail.from_address}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {formatEmailDate(selectedEmail.created_at)}
                </p>
              </div>

              {encrypted && !decryptedBody && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                    <Lock className="w-3 h-3" /> Chiffré PGP
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => setShowDecrypt(true)}>
                    <Lock className="w-3.5 h-3.5" /> Déchiffrer
                  </Button>
                </div>
              )}

              {decryptedBody && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                    ✓ Déchiffré avec succès
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                  {decryptedBody ? (
                    <>
                      <p className="text-xs text-green-600 font-medium mb-3 pb-2 border-b border-green-100 dark:border-green-900">
                        ✓ Contenu déchiffré avec votre clé PGP
                      </p>
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {decryptedBody}
                      </pre>
                    </>
                  ) : selectedEmail.body_html ? (
                    <div
                      className="prose dark:prose-invert max-w-none text-sm overflow-x-auto"
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
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl sm:text-4xl">✉️</span>
            </div>
            <p className="font-medium text-gray-500 text-sm sm:text-base">Sélectionnez un email</p>
            <p className="text-xs sm:text-sm mt-1 opacity-60">pour le lire ici</p>
          </div>
        )}
      </div>

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