'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { PGPKeyResponse } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shield, Eye, EyeOff } from 'lucide-react'

interface PGPSetupProps {
  onSuccess: (key: PGPKeyResponse) => void
  onCancel: () => void
}

export function PGPSetup({ onSuccess, onCancel }: PGPSetupProps) {
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (passphrase.length < 8) {
      setError('La passphrase doit contenir au moins 8 caractères')
      return
    }
    if (passphrase !== confirm) {
      setError('Les passphrases ne correspondent pas')
      return
    }

    setLoading(true)
    setError('')
    try {
      const key = await api.post<PGPKeyResponse>('/pgp/generate', { passphrase })
      onSuccess(key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-violet-600" />
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
          Génération RSA 4096 bits — peut prendre 30 à 60 secondes
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg" role="alert">
          ⚠ {error}
        </p>
      )}

      <div className="relative">
        <Input
          label="Passphrase"
          type={showPass ? 'text' : 'password'}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Choisissez une passphrase sécurisée"
          helperText="Minimum 8 caractères — ne l'oubliez pas, elle ne peut pas être récupérée"
          required
        />
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
        >
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <Input
        label="Confirmer la passphrase"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Répétez la passphrase"
        required
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          loading={loading}
          variant="primary"
          disabled={!passphrase || !confirm}
        >
          <Shield className="w-4 h-4" />
          {loading ? 'Génération en cours...' : 'Générer les clés'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
      </div>
    </div>
  )
}