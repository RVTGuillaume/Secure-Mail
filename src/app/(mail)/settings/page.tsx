'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { usePGPStore } from '@/store/pgpStore'
import { api } from '@/lib/api'
import { PGPKeyResponse } from '@/types'
import { Button } from '@/components/ui/Button'
import { PGPSetup } from '@/components/pgp/PGPSetup'
import {
  User, Shield, Key, Copy, Trash2,
  CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { myKey, hasKey, setMyKey } = usePGPStore()
  const [loadingKey, setLoadingKey] = useState(true)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deletingKey, setDeletingKey] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const key = await api.get<PGPKeyResponse>('/pgp/my-key')
        setMyKey(key)
      } catch {
        setMyKey(null)
      } finally {
        setLoadingKey(false)
      }
    }
    fetchKey()
  }, [])

  const copyPublicKey = async () => {
    if (!myKey) return
    await navigator.clipboard.writeText(myKey.public_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteKey = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeletingKey(true)
    try {
      await api.delete('/pgp/my-key')
      setMyKey(null)
      setDeleteConfirm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingKey(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-6">

        {/* Profil */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profil</h2>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.full_name?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">
                {user?.full_name || user?.username}
              </p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nom d\'utilisateur', value: user?.username },
              { label: 'Email', value: user?.email },
              { label: 'Nom complet', value: user?.full_name || '—' },
              { label: 'Statut', value: user?.is_active ? 'Actif' : 'Inactif' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sécurité PGP */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-950 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Chiffrement PGP</h2>
          </div>

          {loadingKey ? (
            <div className="space-y-3">
              <div className="h-4 w-48 rounded skeleton" />
              <div className="h-4 w-32 rounded skeleton" />
            </div>
          ) : hasKey && myKey ? (
            <div className="space-y-4">
              {/* Statut */}
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Paire de clés RSA 4096 active
                </span>
              </div>

              {/* Fingerprint */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3 h-3" /> Empreinte
                </p>
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {myKey.fingerprint}
                </code>
              </div>

              {/* Key ID */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1.5">Key ID</p>
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {myKey.key_id}
                </code>
              </div>

              {/* Clé publique */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">Clé publique</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      {showPublicKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPublicKey ? 'Masquer' : 'Voir'}
                    </button>
                    <button
                      onClick={copyPublicKey}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>
                {showPublicKey && (
                  <textarea
                    readOnly
                    value={myKey.public_key}
                    className="w-full text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-600 dark:text-gray-400 resize-none h-32"
                  />
                )}
              </div>

              {/* Supprimer */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingKey}
                  onClick={handleDeleteKey}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteConfirm ? 'Confirmer la suppression' : 'Supprimer les clés'}
                </Button>
                {deleteConfirm && (
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Aucune clé PGP configurée. Chiffrez vos emails en générant une paire de clés.
                </span>
              </div>

              {showSetup ? (
                <PGPSetup
                  onSuccess={(key) => { setMyKey(key); setShowSetup(false) }}
                  onCancel={() => setShowSetup(false)}
                />
              ) : (
                <Button onClick={() => setShowSetup(true)} variant="primary">
                  <Shield className="w-4 h-4" />
                  Générer ma paire de clés PGP
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Info compte */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">À propos</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <p>SecureMail v1.0.0 — Messagerie sécurisée avec chiffrement PGP RSA 4096 bits.</p>
            <p>Compte créé le {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
        </section>
      </div>
    </div>
  )
}