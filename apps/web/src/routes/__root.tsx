import { Outlet, Link, useRouter } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import styles from './__root.module.css'

export function RootLayout() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    void router.navigate({ to: '/login' })
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
