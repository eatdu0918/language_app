import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../src/stores/auth'
import { api } from '../src/lib/api'
import type { UserProfile } from '@language-app/shared'

const queryClient = new QueryClient()

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, user, setAuth, hydrate } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (accessToken === null) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!accessToken && !inAuthGroup) {
      void router.replace('/(auth)/login')
    } else if (accessToken && inAuthGroup) {
      void router.replace('/(tabs)/')
    } else if (accessToken && !user) {
      api.get<UserProfile>('/users/me').then((profile) => {
        void setAuth(profile, accessToken)
      }).catch(() => {
        void router.replace('/(auth)/login')
      })
    }
  }, [accessToken, segments, user, setAuth, router])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </QueryClientProvider>
  )
}
