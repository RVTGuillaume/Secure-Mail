import { authStorage } from './auth'
import { Token, ApiError } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!

class ApiClient {
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: unknown) => void
  }> = []

  private processQueue(error: unknown, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token!)
    })
    this.failedQueue = []
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub: refreshToken }),
    })

    if (!response.ok) {
      authStorage.clearTokens()
      window.location.href = '/login'
      throw new Error('Refresh failed')
    }

    const data: Token = await response.json()
    authStorage.setTokens(data.access_token, data.refresh_token)
    return data.access_token
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authStorage.getAccessToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    // Ne pas définir Content-Type pour FormData
    if (options.body instanceof FormData) {
      const { 'Content-Type': _, ...rest } = headers as Record<string, string>
      Object.assign(headers, rest)
      delete (headers as Record<string, string>)['Content-Type']
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Token expiré → refresh automatique
    if (response.status === 401) {
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          return this.request<T>(endpoint, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          })
        })
      }

      this.isRefreshing = true
      try {
        const newToken = await this.refreshToken()
        this.processQueue(null, newToken)
        return this.request<T>(endpoint, options)
      } catch (error) {
        this.processQueue(error, null)
        throw error
      } finally {
        this.isRefreshing = false
      }
    }

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`
      try {
        const err: ApiError = await response.json()
        errorMessage = err.detail || errorMessage
      } catch {
        // pas de body JSON
      }
      throw new Error(errorMessage)
    }

    // Réponse vide (204 ou DELETE)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async download(endpoint: string): Promise<Blob> {
    const token = authStorage.getAccessToken()
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Téléchargement échoué')
    return response.blob()
  }
}

export const api = new ApiClient()