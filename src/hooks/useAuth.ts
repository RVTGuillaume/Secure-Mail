'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { usePGPStore } from '@/store/pgpStore'
import { api } from '@/lib/api'
import { authStorage } from '@/lib/auth'
import { UserResponse, PGPKeyResponse } from '@/types'

export function useAuth() {
  const { user, setUser, logout, setLoading, isLoading } = useAuthStore()
  const { setMyKey } = usePGPStore()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      if (!authStorage.isAuthenticated()) {
        router.replace('/login')
        return
      }
      if (user) return

      setLoading(true)
      try {
        const me = await api.get<UserResponse>('/auth/me')
        setUser(me)

        // Charger la clé PGP automatiquement
        try {
          const key = await api.get<PGPKeyResponse>('/pgp/my-key')
          setMyKey(key)
        } catch {
          setMyKey(null)
        }
      } catch {
        logout()
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return { user, isLoading, logout: handleLogout }
}