'use client'

import { useState } from 'react'
import { X, Send, FileText, Lock, Unlock, Paperclip, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { usePGPStore } from '@/store/pgpStore'
import { PGPKeyResponse } from '@/types'

interface ComposeModalProps {
  onClose: () => void
  replyTo?: { to: string; subject: string; emailId: string }
}

export function ComposeModal({ onClose, replyTo }: ComposeModalProps) {
  const { hasKey } = usePGPStore()

  const [to, setTo] = useState(replyTo?.to || '')
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  // PGP state
  const [encrypt, setEncrypt] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [recipientKey, setRecipientKey] = useState<PGPKeyResponse | null>(null)
  const [checkingRecipient, setCheckingRecipient] = useState(false)
  const [recipientError, setRecipientError] = useState('')

  // UI state
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Chercher la clé PGP du destinataire automatiquement quand l'email change
  const handleToBlur = async () => {
    if (!encrypt || !to.trim()) return
    setCheckingRecipient(true)
    setRecipientError('')
    setRecipientKey(null)
    try {
      const key = await api.get<PGPKeyResponse>(`/pgp/find-by-email/${encodeURIComponent(to.trim())}`)
      setRecipientKey(key)
    } catch {
      setRecipientError('Ce destinataire n\'a pas de clé PGP — message non chiffrable')
    } finally {
      setCheckingRecipient(false)
    }
  }

  const handleToggleEncrypt = async () => {
    const newEncrypt = !encrypt
    setEncrypt(newEncrypt)
    setRecipientKey(null)
    setRecipientError('')
    if (newEncrypt && to.trim()) {
      setCheckingRecipient(true)
      try {
        const key = await api.get<PGPKeyResponse>(`/pgp/find-by-email/${encodeURIComponent(to.trim())}`)
        setRecipientKey(key)
      } catch {
        setRecipientError('Ce destinataire n\'a pas de clé PGP — message non chiffrable')
      } finally {
        setCheckingRecipient(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])])
  }

  const handleSend = async () => {
    if (!to.trim()) { setError('Le destinataire est requis'); return }
    if (!subject.trim()) { setError('L\'objet est requis'); return }
    if (!body.trim()) { setError('Le message est vide'); return }
    if (encrypt && !passphrase) { setError('La passphrase PGP est requise pour chiffrer'); return }
    if (encrypt && !recipientKey) { setError('Impossible de chiffrer : clé PGP du destinataire introuvable'); return }

    setSending(true)
    setError('')

    try {
      let finalBody = body

      if (encrypt && recipientKey && passphrase) {
        const result = await api.post<{ encrypted_message: string }>('/pgp/encrypt', {
          message: body,
          recipient_user_id: recipientKey.user_id,
        })
        finalBody = result.encrypted_message
      }

      const formData = new FormData()
      formData.append('to_addresses', JSON.stringify([to.trim()]))
      formData.append('subject', subject.trim())
      formData.append('body_text', finalBody)
      formData.append('cc', JSON.stringify([]))
      formData.append('bcc', JSON.stringify([]))
      formData.append('labels', JSON.stringify([]))
      if (replyTo?.emailId) formData.append('reply_to_id', replyTo.emailId)
      attachments.forEach((file) => formData.append('files', file))

      await api.request('/emails/send', { method: 'POST', body: formData })
      setSuccess('Email envoyé avec succès !')
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi échoué')
    } finally {
      setSending(false)
    }
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      await api.post('/emails/drafts', {
        to_addresses: to ? [to] : [],
        subject,
        body_text: body,
      })
      setSuccess('Brouillon enregistré')
      setTimeout(onClose, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSavingDraft(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Composer un email"
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {replyTo ? 'Répondre' : 'Nouveau message'}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSaveDraft} loading={savingDraft} disabled={sending}>
              <FileText className="w-4 h-4" />
              Brouillon
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fermer la fenêtre de composition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(error || success) && (
            <div role="alert" className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
              success
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400'
            }`}>
              {success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {success || error}
            </div>
          )}

          <Input
            label="À"
            type="email"
            value={to}
            onChange={(e) => { setTo(e.target.value); setRecipientKey(null) }}
            onBlur={handleToBlur}
            placeholder="destinataire@exemple.com"
            required
            disabled={sending}
          />

          <Input
            label="Objet"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet du message"
            disabled={sending}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={9}
              disabled={sending}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-gray-400 disabled:opacity-60"
            />
          </div>

          {/* Section PGP — visible seulement si l'utilisateur a une clé */}
          {hasKey && (
            <div className={`rounded-xl border transition-all ${
              encrypt
                ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              {/* Toggle PGP */}
              <button
                type="button"
                onClick={handleToggleEncrypt}
                disabled={sending || checkingRecipient}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                aria-pressed={encrypt}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  encrypt ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {encrypt
                    ? <Lock className="w-4 h-4 text-white" />
                    : <Unlock className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${encrypt ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {checkingRecipient ? 'Vérification...' : encrypt ? 'Chiffrement PGP activé' : 'Activer le chiffrement PGP'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {encrypt ? 'Seul le destinataire pourra lire ce message' : 'Message envoyé sans chiffrement'}
                  </p>
                </div>
                {/* Indicateur statut destinataire */}
                {encrypt && !checkingRecipient && (
                  recipientKey
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </button>

              {/* Détails PGP si activé */}
              {encrypt && (
                <div className="px-4 pb-4 space-y-3 border-t border-violet-100 dark:border-violet-900 pt-3">
                  {/* Statut clé destinataire */}
                  {recipientError && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">{recipientError}</p>
                    </div>
                  )}
                  {recipientKey && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Clé PGP trouvée — ID : <code className="font-mono">{recipientKey.key_id}</code>
                      </p>
                    </div>
                  )}

                  {/* Passphrase */}
                  <div className="relative">
                    <Input
                      label="Votre passphrase PGP"
                      type={showPass ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Votre passphrase pour signer"
                      helperText="Nécessaire pour autoriser le chiffrement"
                      disabled={sending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                      aria-label={showPass ? 'Masquer' : 'Afficher'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pièces jointes */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border border-gray-100 dark:border-gray-700">
                  <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                    aria-label={`Supprimer ${file.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <Button onClick={handleSend} loading={sending} disabled={savingDraft} size="md">
            <Send className="w-4 h-4" />
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>

          <label
            className="cursor-pointer p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Joindre un fichier"
            title="Joindre un fichier"
          >
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            />
          </label>

          <span className="text-xs text-gray-400 ml-auto">{body.length} caractères</span>
        </div>
      </div>
    </div>
  )
}