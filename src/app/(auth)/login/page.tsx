'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { authStorage } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { Token, UserResponse } from '@/types'

interface FormErrors {
  email?: string
  password?: string
  global?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!email) newErrors.email = 'L\'email est requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email invalide'
    if (!password) newErrors.password = 'Le mot de passe est requis'
    else if (password.length < 8) newErrors.password = 'Minimum 8 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const token = await api.post<Token>('/auth/login', { email, password })
      authStorage.setTokens(token.access_token, token.refresh_token)

      const user = await api.get<UserResponse>('/auth/me')
      setUser(user)

      router.push('/inbox')
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : 'Connexion échouée' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Connexion
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Accédez à votre messagerie sécurisée
        </p>
      </div>

      {/* Erreur globale */}
      {errors.global && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2"
        >
          <span>⚠️</span>
          {errors.global}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full mt-2"
          size="lg"
        >
          <LogIn className="w-4 h-4" />
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  )
}