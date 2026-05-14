import { useEffect } from 'react'
import { Outlet, Link, useRouter, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import styles from './__root.module.css'

export function RootLayout() {
  const { user, logout, initialized, initialize } = useAuthStore()
  const router = useRouter()
  const location = useLocation()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (!initialized) return
    if (!user && location.pathname !== '/login') {
      void router.navigate({ to: '/login' })
    }
  }, [initialized, user, location.pathname, router])

  const handleLogout = () => {
    logout()
    void router.navigate({ to: '/login' })
  }

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {user && (
        <nav className={styles.nav}>
          <div className={styles.logo}>LangApp</div>
          <div className={styles.links}>
            <Link to="/" activeProps={{ className: styles.active }}>대시보드</Link>
            <Link to="/vocabulary" activeProps={{ className: styles.active }}>단어</Link>
            <Link to="/documents" activeProps={{ className: styles.active }}>문서</Link>
            <Link to="/conversation" activeProps={{ className: styles.active }}>회화</Link>
            <Link to="/exam" activeProps={{ className: styles.active }}>시험준비</Link>
            <Link to="/billing" activeProps={{ className: styles.active }}>구독</Link>
          </div>
          <button onClick={handleLogout} className={styles.logout}>로그아웃</button>
        </nav>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
