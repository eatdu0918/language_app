import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { useAuthStore } from '../stores/auth.store'
import type { PlacementQuestion, PlacementResult, SupportedLanguage } from '@language-app/shared'
import styles from './placement.module.css'

const LANG_LABELS: Record<SupportedLanguage, string> = { en: '영어', ja: '일본어' }

export function PlacementPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const [lang, setLang] = useState<SupportedLanguage | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<PlacementResult | null>(null)

  const { data: questions, isLoading } = useQuery({
    queryKey: ['placement', 'questions', lang],
    queryFn: () => api.get<PlacementQuestion[]>(`/placement/questions?language=${lang}`),
    enabled: !!lang,
  })

  const submitMutation = useMutation({
    mutationFn: (payload: { language: SupportedLanguage; answers: Record<string, string> }) =>
      api.post<PlacementResult>('/placement/submit', payload),
    onSuccess: async (data) => {
      setResult(data)
      const updatedUser = await api.get<NonNullable<typeof user>>('/users/me')
      if (updatedUser && user) setAuth(updatedUser, localStorage.getItem('accessToken') ?? '', localStorage.getItem('refreshToken') ?? '')
    },
  })

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = () => {
    if (!lang || !questions) return
    submitMutation.mutate({ language: lang, answers })
  }

  const answeredCount = Object.keys(answers).length
  const totalCount = questions?.length ?? 0

  if (result) {
    const levelLabels: Record<string, string> = {
      beginner: '초급',
      elementary: '초중급',
      intermediate: '중급',
      advanced: '고급',
    }
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>🎯</div>
          <h1 className={styles.resultTitle}>평가 완료!</h1>
          <p className={styles.resultScore}>{result.score} / {result.total} 정답</p>
          <div className={styles.resultLevel}>
            <span className={styles.levelBadge}>{levelLabels[result.level] ?? result.level}</span>
            <p>레벨로 설정됐습니다.</p>
          </div>
          <p className={styles.resultDesc}>
            {LANG_LABELS[lang!]} 레벨이 <strong>{levelLabels[result.level]}</strong>으로 설정됐습니다.
            단어와 문서가 이 레벨에 맞게 조정됩니다.
          </p>
          <button className={styles.startBtn} onClick={() => void router.navigate({ to: '/' })}>
            학습 시작하기 →
          </button>
        </div>
      </div>
    )
  }

  if (!lang) {
    return (
      <div className={styles.container}>
        <div className={styles.intro}>
          <h1 className={styles.title}>레벨 평가</h1>
          <p className={styles.desc}>
            간단한 10문항으로 현재 수준을 파악하고 맞춤 학습을 시작하세요.
          </p>
          <div className={styles.langButtons}>
            {(['en', 'ja'] as SupportedLanguage[]).map((l) => (
              <button key={l} className={styles.langBtn} onClick={() => setLang(l)}>
                {l === 'en' ? '🇺🇸' : '🇯🇵'} {LANG_LABELS[l]} 평가 시작
              </button>
            ))}
          </div>
          <button className={styles.skipBtn} onClick={() => void router.navigate({ to: '/' })}>
            건너뛰기 (나중에 하기)
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className={styles.center}>문제 불러오는 중...</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{LANG_LABELS[lang]} 레벨 평가</h1>
        <p className={styles.progress}>{answeredCount} / {totalCount} 답변</p>
      </div>

      <div className={styles.questions}>
        {questions?.map((q, idx) => (
          <div key={q.id} className={styles.questionCard}>
            <p className={styles.questionNum}>Q{idx + 1}</p>
            <p className={styles.questionText}>{q.question}</p>
            <div className={styles.options}>
              {q.options.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.option} ${answers[q.id] === opt ? styles.selected : ''}`}
                  onClick={() => handleAnswer(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={answeredCount < totalCount || submitMutation.isPending}
      >
        {submitMutation.isPending ? '채점 중...' : `제출하기 (${answeredCount}/${totalCount})`}
      </button>
    </div>
  )
}
