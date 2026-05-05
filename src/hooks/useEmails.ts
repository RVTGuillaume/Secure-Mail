'use client'

import { useCallback, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useEmailStore } from '@/store/emailStore'
import { EmailListResponse, Folder } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnreadCountsResponse {
  counts: Record<Folder, number>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmails(folder: Folder) {
  const {
    setEmails,
    setLoading,
    setCurrentFolder,
    setUnreadCounts,
    currentPage,
    isLoading,
    emails,
    totalEmails,
    updateEmail,
    removeEmail,
  } = useEmailStore()

  // Ref pour éviter les appels en doublon si le composant re-render vite
  const fetchingRef = useRef(false)

  // ── Lire les emails depuis MongoDB (lecture seule, pas de sync IMAP) ────────
  // Le sync IMAP est géré exclusivement par le SSE (events.py)
  const fetchEmails = useCallback(async (page = 1) => {
    if (fetchingRef.current) return      // évite les appels concurrents
    fetchingRef.current = true
    setLoading(true)
    try {
      const data = await api.get<EmailListResponse>(
        `/emails/${folder}?page=${page}&per_page=20`
      )
      setEmails(data.emails, data.total)
    } catch {
      if (page === 1) console.warn('[useEmails] Backend indisponible, retry automatique')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [folder, setEmails, setLoading])

  // ── Comptage des non-lus via un endpoint dédié ───────────────────────────
  // ⚠️  Ne charge PAS tous les emails pour compter — utilise l'endpoint /unread-counts
  // Si cet endpoint n'existe pas encore, voir note en bas de fichier
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const data = await api.get<UnreadCountsResponse>('/emails/unread-counts')
      setUnreadCounts(data.counts)
    } catch {
      // Silencieux — les compteurs restent à leur dernière valeur connue
    }
  }, [setUnreadCounts])

  // ── Appelé par useSSE quand de nouveaux emails arrivent ──────────────────
  // C'est le seul endroit où on rafraîchit suite à un événement SSE
  const onSSENewEmails = useCallback(async () => {
    if (folder === 'inbox') {
      await fetchEmails(1)           // rafraîchir la liste
    }
    await fetchUnreadCounts()        // mettre à jour les badges
  }, [folder, fetchEmails, fetchUnreadCounts])

  // ── Actions utilisateur ──────────────────────────────────────────────────

  const markRead = useCallback(async (emailId: string, isRead: boolean) => {
    updateEmail(emailId, { is_read: isRead })   // optimistic update
    try {
      await api.patch(`/emails/message/${emailId}/read?is_read=${isRead}`)
      await fetchUnreadCounts()
    } catch {
      updateEmail(emailId, { is_read: !isRead }) // rollback si erreur
    }
  }, [updateEmail, fetchUnreadCounts])

  const toggleStar = useCallback(async (emailId: string, isStarred: boolean) => {
    updateEmail(emailId, { is_starred: isStarred })
    try {
      await api.patch(`/emails/message/${emailId}/star?is_starred=${isStarred}`)
    } catch {
      updateEmail(emailId, { is_starred: !isStarred })
    }
  }, [updateEmail])

  const deleteEmail = useCallback(async (emailId: string) => {
    removeEmail(emailId)
    try {
      await api.delete(`/emails/message/${emailId}`)
      await fetchUnreadCounts()
    } catch {
      console.error('[useEmails] Erreur suppression email')
    }
  }, [removeEmail, fetchUnreadCounts])

  const moveEmail = useCallback(async (emailId: string, targetFolder: Folder) => {
    removeEmail(emailId)
    try {
      await api.patch(`/emails/message/${emailId}/move`, { folder: targetFolder })
      await fetchUnreadCounts()
    } catch {
      console.error('[useEmails] Erreur déplacement email')
    }
  }, [removeEmail, fetchUnreadCounts])

  // ── Cycle de vie ─────────────────────────────────────────────────────────
  // Plus d'intervalle ici — le SSE gère le sync IMAP et appelle onSSENewEmails
  useEffect(() => {
    setCurrentFolder(folder)
    fetchEmails(1)
    fetchUnreadCounts()
  }, [folder, setCurrentFolder, fetchEmails, fetchUnreadCounts])  // ✅ deps complètes

  return {
    emails,
    totalEmails,
    isLoading,
    currentPage,
    fetchEmails,
    onSSENewEmails,   // ← à brancher dans useSSE via onNewEmails
    markRead,
    toggleStar,
    deleteEmail,
    moveEmail,
  }
}