import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api-client'
import type { VocabularyStats } from '@language-app/shared'
import styles from './dashboard.module.css'

const CATEGORIES = [
  { to: '/vocabulary', label: '단어', icon: '📖', desc: '스페이스드 리피티션으로 단어 암기' },
  { to: '/documents', label: '문서', icon: '📄', desc: 'AI 레벨 조정 원문 읽기 연습' },
  { to: '/conversation', label: '회화', icon: '🎙️', desc: 'AI와 실시간 음성 대화 연습' },
] as const

export function DashboardPage() {
  const { user } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['vocabulary', 'stats'],
    queryFn: () => api.get<VocabularyStats>('/vocabulary/stats'),
  })

  const statItems = [
    { label: '오늘 복습 예정', value: stats?.dueToday ?? '-', highlight: (stats?.dueToday ?? 0) > 0 },
    { label: '오늘 완료', value: stats?.reviewedToday ?? '-', highlight: false },
    { label: '학습한 단어', value: stats?.totalLearned ?? '-', highlight: false },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>안녕하세요, {user?.name ?? '학습자'}님 👋</h1>
        <p className={styles.sub}>오늘도 꾸준히 학습해 봐요.</p>
      </div>

      <div className={styles.statsRow}>
        {statItems.map((s) => (
          <div key={s.label} className={`${styles.statCard} ${s.highlight ? styles.statHighlight : ''}`}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Link key={cat.to} to={cat.to} className={styles.card}>
            <span className={styles.icon}>{cat.icon}</span>
            <h2 className={styles.cardTitle}>{cat.label}</h2>
            <p className={styles.cardDesc}>{cat.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
