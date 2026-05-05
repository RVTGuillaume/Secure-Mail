'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Lock, X, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface PGPDecryptModalProps {
  encryptedMessage: string
  onDecrypted: (message: string) => void
  onClose: () => void
}

export function PGPDecryptModal({ encryptedMessage, onDecrypted, onClose }: PGPDecryptModalProps) {
  const [passphrase, setPassphrase] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isNotForMe = error.includes('NO_SECKEY') || error.includes('Pas de clef secrète') || error.includes('no secret key')

  const handleDecrypt = async () => {
    if (!passphrase) { setError('La passphrase est requise'); return }
    setLoading(true)
    setError('')
    try {
      const result = await api.post<{ decrypted_message: string }>('/pgp/decrypt', {
        encrypted_message: encryptedMessage,
        passphrase,
      })
      onDecrypted(result.decrypted_message)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Déchiffrement échoué'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Déchiffrer le message PGP"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-950 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Déchiffrer le message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ce message est chiffré avec une clé PGP. Entrez votre passphrase pour le déchiffrer.
          </p>

          {/* Erreur */}
          {error && (
            <div role="alert" className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  {isNotForMe ? (
                    <>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Ce message n'est pas destiné à votre clé PGP
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        Le message a été chiffré pour un autre destinataire. Seul le titulaire de la clé cible peut le déchiffrer.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error.includes('passphrase') || error.includes('Déchiffrement échoué')
                        ? 'Passphrase incorrecte. Vérifiez et réessayez.'
                        : 'Déchiffrement échoué. Vérifiez votre passphrase.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Champ passphrase */}
          <div className="relative">
            <Input
              label="Votre passphrase PGP"
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setError('') }}
              placeholder="Entrez votre passphrase"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleDecrypt()}
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPass ? 'Masquer' : 'Afficher'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleDecrypt}
              loading={loading}
              disabled={!passphrase}
              className="flex-1"
            >
              <Lock className="w-4 h-4" />
              Déchiffrer
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}