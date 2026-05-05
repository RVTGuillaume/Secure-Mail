// src/hooks/useSSE.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { authStorage } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SSENewEmailsEvent {
  type: 'new_emails'
  new_count: number
  unread_count: number
  total: number
}

interface SSEErrorEvent {
  type: 'error'
  message: string
  fatal: boolean
}

interface UseSSEOptions {
  onNewEmails?: (data: SSENewEmailsEvent) => void
  enabled?: boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BASE_RETRY_MS = 3_000
const MAX_RETRY_MS  = 30_000
const MAX_RETRIES   = 10

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSSE({ onNewEmails, enabled = true }: UseSSEOptions) {
  const esRef          = useRef<EventSource | null>(null)
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount     = useRef(0)
  const mountedRef     = useRef(true)
  const lastEventIdRef = useRef<string>('0')
  const onNewEmailsRef = useRef(onNewEmails)

  // Toujours à jour sans recréer connect()
  useEffect(() => {
    onNewEmailsRef.current = onNewEmails
  }, [onNewEmails])

  // ── Nettoyage propre ────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
  }, [])

  // ── Reconnexion avec backoff exponentiel ─────────────────────────────────
  // On déclare connect via useRef pour éviter la dépendance circulaire
  const connectRef = useRef<() => void>(() => {})

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return
    if (retryCount.current >= MAX_RETRIES) {
      console.warn('[SSE] Abandon après', MAX_RETRIES, 'tentatives.')
      return
    }
    const delay = Math.min(
      BASE_RETRY_MS * Math.pow(1.5, retryCount.current),
      MAX_RETRY_MS
    )
    retryCount.current++
    console.info(`[SSE] Reconnexion dans ${Math.round(delay / 1000)}s (tentative ${retryCount.current}/${MAX_RETRIES})`)
    retryTimerRef.current = setTimeout(() => connectRef.current(), delay)
  }, [])

  // ── Connexion principale ─────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!enabled || !mountedRef.current) return

    // ── Vérifier / rafraîchir le token AVANT de connecter ──
    let token = authStorage.getAccessToken()

    if (!token) {
      console.warn('[SSE] Aucun token, connexion annulée.')
      return
    }

    if (authStorage.isAccessTokenExpired()) {
      console.info('[SSE] Token expiré, tentative de rafraîchissement...')
      token = await authStorage.refreshAccessToken()
      if (!token) {
        // Refresh échoué → déconnexion totale, inutile de reconnecter le SSE
        console.error('[SSE] Rafraîchissement échoué. Session terminée.')
        cleanup()
        // Optionnel : rediriger vers /login
        // window.location.href = '/login'
        return
      }
      console.info('[SSE] Token rafraîchi avec succès.')
    }

    cleanup()

    const baseUrl = process.env.NEXT_PUBLIC_API_URL!
    const url = new URL(`${baseUrl}/events/stream`)
    url.searchParams.set('token', token)
    // On envoie le dernier event_id connu pour que le backend puisse reprendre
    url.searchParams.set('last_event_id', lastEventIdRef.current)

    const es = new EventSource(url.toString())
    esRef.current = es

    // ── Connexion ouverte ──────────────────────────────────────────────────
    es.onopen = () => {
      console.info('[SSE] Connexion établie.')
      retryCount.current = 0  // reset le compteur d'erreurs
    }

    // ── connected : le serveur confirme qu'il est prêt ────────────────────
    es.addEventListener('connected', () => {
      console.info('[SSE] Serveur prêt, écoute des emails...')
    })

    // ── new_emails : nouveaux emails détectés ─────────────────────────────
    es.addEventListener('new_emails', (event: MessageEvent) => {
      if (event.lastEventId) {
        lastEventIdRef.current = event.lastEventId
      }
      try {
        const data: SSENewEmailsEvent = JSON.parse(event.data)
        onNewEmailsRef.current?.(data)
      } catch {
        console.error('[SSE] Payload new_emails invalide:', event.data)
      }
    })

    // ── heartbeat : juste pour garder la connexion vivante ────────────────
    es.addEventListener('heartbeat', (event: MessageEvent) => {
      if (event.lastEventId) {
        lastEventIdRef.current = event.lastEventId
      }
    })

    // ── error (événement MÉTIER envoyé par le backend) ────────────────────
    // Attention : différent de es.onerror qui gère les erreurs RÉSEAU
    es.addEventListener('error', (rawEvent: Event) => {
      if (!(rawEvent instanceof MessageEvent)) return  // erreur réseau → ignorée ici
      try {
        const data: SSEErrorEvent = JSON.parse((rawEvent as MessageEvent).data)
        console.error('[SSE] Erreur backend:', data.message)

        if (data.fatal) {
          // Ex : credentials Gmail manquants → inutile de reconnecter
          console.error('[SSE] Erreur fatale. Reconnexion désactivée.')
          cleanup()
          return
        }
        // Erreur non fatale (ex: erreur serveur temporaire) → on reconnecte
        cleanup()
        scheduleReconnect()
      } catch {
        // Pas un MessageEvent avec data → c'est une erreur réseau, ignorée
      }
    })

    // ── onerror : coupure réseau, cold start Render, timeout proxy ────────
    es.onerror = () => {
      if (!mountedRef.current) return
      console.warn('[SSE] Connexion perdue (réseau). Tentative de reconnexion...')
      cleanup()
      scheduleReconnect()
    }

  }, [enabled, cleanup, scheduleReconnect])

  // Garder connectRef synchronisé avec connect (évite la dépendance circulaire)
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  // ── Cycle de vie ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [connect, cleanup])
}