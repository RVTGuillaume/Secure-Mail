// src/lib/auth.ts

const ACCESS_TOKEN_KEY  = 'sm_access_token'
const REFRESH_TOKEN_KEY = 'sm_refresh_token'

const isBrowser = typeof window !== 'undefined'

// ─── Cookies (pour le proxy Next.js) ─────────────────────────────────────────

function setCookie(name: string, value: string, days = 7): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/**
 * Décode le payload d'un JWT sans vérifier la signature.
 * On l'utilise uniquement pour lire l'expiration côté client.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    // Padding base64 si nécessaire
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Retourne true si le token est expiré ou invalide.
 * On ajoute 30 secondes de marge pour anticiper l'expiration.
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return true
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp < nowInSeconds + 30  // 30s de marge
}

// ─── authStorage ──────────────────────────────────────────────────────────────

export const authStorage = {

  getAccessToken(): string | null {
    if (!isBrowser) return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    if (!isBrowser) return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken: string, refreshToken: string): void {
    if (!isBrowser) return
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    setCookie(ACCESS_TOKEN_KEY, accessToken, 1)
    setCookie(REFRESH_TOKEN_KEY, refreshToken, 7)
  },

  clearTokens(): void {
    if (!isBrowser) return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    deleteCookie(ACCESS_TOKEN_KEY)
    deleteCookie(REFRESH_TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    if (!isBrowser) return false
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  /**
   * Vérifie si le token d'accès est expiré ou sur le point de l'être.
   * Utilisé par useSSE avant chaque reconnexion.
   */
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken()
    if (!token) return true
    return isTokenExpired(token)
  },

  /**
   * Tente de rafraîchir le token d'accès via le refresh token.
   * Retourne le nouveau access token, ou null si échec.
   */
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken || isTokenExpired(refreshToken)) {
      // Refresh token lui-même expiré → déconnexion obligatoire
      this.clearTokens()
      return null
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL!
      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const data = await response.json()
      const newAccessToken: string  = data.access_token
      const newRefreshToken: string = data.refresh_token ?? refreshToken

      this.setTokens(newAccessToken, newRefreshToken)
      return newAccessToken

    } catch {
      // Réseau indisponible → on ne déconnecte pas, on réessaiera plus tard
      return null
    }
  },
}