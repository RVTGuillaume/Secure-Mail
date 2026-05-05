import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PGPKeyResponse } from '@/types'

interface PGPState {
  myKey: PGPKeyResponse | null
  hasKey: boolean
  isGenerating: boolean
  setMyKey: (key: PGPKeyResponse | null) => void
  setGenerating: (generating: boolean) => void
}

export const usePGPStore = create<PGPState>()(
  persist(
    (set) => ({
      myKey: null,
      hasKey: false,
      isGenerating: false,
      setMyKey: (key) => set({ myKey: key, hasKey: !!key }),
      setGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: 'securemail-pgp-v1',
      partialize: (state) => ({
        myKey: state.myKey,
        hasKey: state.hasKey,
      }),
    }
  )
)