import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import { useAuthStore } from '../stores/auth.store'
import type { AuthTokens, UserProfile } from '@language-app/shared'
import styles from './login.module.css'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { accessToken } = await api.post<AuthTokens>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        mode === 'login' ? { email, password } : { email, name, password },
      )
      const user = await api.get<UserProfile>('/users/me')
      setAuth(user, accessToken)
      void router.navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>LangApp</h1>
        <p className={styles.subtitle}>AI와 함께하는 언어 학습</p>

        <div className={styles.tabs}>
          <button className={mode === 'login' ? styles.activeTab : ''} onClick={() => setMode('login')}>로그인</button>
          <button className={mode === 'register' ? styles.activeTab : ''} onClick={() => setMode('register')}>회원가입</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className={styles.form}>
          {mode === 'register' && (
            <input className={styles.input} type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className={styles.input} type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={styles.input} type="password" placeholder="비밀번호 (8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
