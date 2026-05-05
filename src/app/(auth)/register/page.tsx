'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { authStorage } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { Token, UserResponse } from '@/types'

interface FormErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  full_name?: string
  gmail_app_password?: string
  global?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    gmail_app_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showGmailPassword, setShowGmailPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.email) newErrors.email = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email invalide'
    if (!form.username) newErrors.username = "Le nom d'utilisateur est requis"
    else if (form.username.length < 3)
      newErrors.username = 'Minimum 3 caractères'
    if (!form.password) newErrors.password = 'Le mot de passe est requis'
    else if (form.password.length < 8)
      newErrors.password = 'Minimum 8 caractères'
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    if (!form.gmail_app_password)
      newErrors.gmail_app_password = 'Le mot de passe Gmail est requis'
    else if (form.gmail_app_password.replace(/\s/g, '').length !== 16)
      newErrors.gmail_app_password = 'Le mot de passe d\'application Gmail doit faire 16 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      await api.post('/auth/register', {
        email: form.email,
        username: form.username,
        password: form.password,
        full_name: form.full_name || undefined,
        gmail_app_password: form.gmail_app_password.replace(/\s/g, ''),
      })

      const token = await api.post<Token>('/auth/login', {
        email: form.email,
        password: form.password,
      })
      authStorage.setTokens(token.access_token, token.refresh_token)

      const user = await api.get<UserResponse>('/auth/me')
      setUser(user)

      router.push('/inbox')
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : 'Inscription échouée' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Créer un compte
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Rejoignez SecureMail en quelques secondes
        </p>
      </div>

      {errors.global && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2"
        >
          <span>⚠️</span> {errors.global}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Nom complet"
          type="text"
          value={form.full_name}
          onChange={update('full_name')}
          placeholder="Jean Dupont"
          autoComplete="name"
          disabled={loading}
          helperText="Optionnel"
        />

        <Input
          label="Adresse Gmail"
          type="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          placeholder="vous@gmail.com"
          autoComplete="email"
          required
          disabled={loading}
          helperText="Doit être une adresse Gmail valide"
        />

        <Input
          label="Nom d'utilisateur"
          type="text"
          value={form.username}
          onChange={update('username')}
          error={errors.username}
          placeholder="jean_dupont"
          autoComplete="username"
          required
          disabled={loading}
          helperText="3 caractères minimum, sans espaces"
        />

        {/* Mot de passe Gmail App */}
        <div>
          <div className="relative">
            <Input
              label="Mot de passe d'application Gmail"
              type={showGmailPassword ? 'text' : 'password'}
              value={form.gmail_app_password}
              onChange={update('gmail_app_password')}
              error={errors.gmail_app_password}
              placeholder="xxxx xxxx xxxx xxxx"
              required
              disabled={loading}
              helperText="16 caractères — généré depuis myaccount.google.com"
            />
            <button
              type="button"
              onClick={() => setShowGmailPassword(!showGmailPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showGmailPassword ? 'Masquer' : 'Afficher'}
            >
              {showGmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Guide rapide */}
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p className="font-medium">Comment obtenir ce mot de passe ?</p>
                <ol className="list-decimal list-inside space-y-0.5 opacity-90">
                  <li>Allez sur myaccount.google.com</li>
                  <li>Sécurité → Validation en 2 étapes (activer)</li>
                  <li>Sécurité → Mots de passe des applications</li>
                  <li>Créer → copiez le code 16 caractères</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            label="Mot de passe SecureMail"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={loading}
            helperText="8 caractères minimum"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Masquer' : 'Afficher'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Confirmer le mot de passe"
          type="password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={loading}
        />

        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          <UserPlus className="w-4 h-4" />
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Se connecter
        </Link>
      </p>
    </div>
  )
}