import { create } from 'zustand'
import { api } from '../lib/api-client'
import type { UserProfile } from '@language-app/shared'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  initialized: boolean
  setAuth: (user: UserProfile, token: string) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  initialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      const user = await api.get<UserProfile>('/users/me')
      set({ user, accessToken: token, initialized: true })
    } catch {
      localStorage.removeItem('accessToken')
      set({ user: null, accessToken: null, initialized: true })
    }
  },
}))
