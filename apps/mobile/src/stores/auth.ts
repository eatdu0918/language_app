import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProfile } from '@language-app/shared'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  setAuth: (user: UserProfile, token: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },
  logout: async () => {
    await AsyncStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  },
  hydrate: async () => {
    const token = await AsyncStorage.getItem('accessToken')
    set({ accessToken: token })
  },
}))
