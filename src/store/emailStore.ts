import { create } from 'zustand'
import { EmailResponse, Folder } from '@/types'

interface EmailState {
  emails: EmailResponse[]
  selectedEmail: EmailResponse | null
  currentFolder: Folder
  totalEmails: number
  currentPage: number
  isLoading: boolean
  unreadCounts: Record<Folder, number>

  setEmails: (emails: EmailResponse[], total: number) => void
  setSelectedEmail: (email: EmailResponse | null) => void
  setCurrentFolder: (folder: Folder) => void
  setCurrentPage: (page: number) => void
  setLoading: (loading: boolean) => void
  setUnreadCounts: (counts: Record<Folder, number>) => void
  updateEmail: (id: string, updates: Partial<EmailResponse>) => void
  removeEmail: (id: string) => void
}

export const useEmailStore = create<EmailState>((set) => ({
  emails: [],
  selectedEmail: null,
  currentFolder: 'inbox',
  totalEmails: 0,
  currentPage: 1,
  isLoading: false,
  unreadCounts: {
    inbox: 0, sent: 0, drafts: 0, trash: 0, archive: 0,
  },

  setEmails: (emails, total) => set({ emails, totalEmails: total }),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setCurrentFolder: (folder) => set({ currentFolder: folder, currentPage: 1, selectedEmail: null }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (isLoading) => set({ isLoading }),
  setUnreadCounts: (unreadCounts) => set({ unreadCounts }),

  updateEmail: (id, updates) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      selectedEmail:
        state.selectedEmail?.id === id
          ? { ...state.selectedEmail, ...updates }
          : state.selectedEmail,
    })),

  removeEmail: (id) =>
    set((state) => ({
      emails: state.emails.filter((e) => e.id !== id),
      selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
    })),
}))