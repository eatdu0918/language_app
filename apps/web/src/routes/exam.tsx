import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type {
  ExamType, ExamLevel, ToeicLevel, JlptLevel,
  ExamQuestion, ExamSession, ExamStats,
} from '@language-app/shared'
import styles from './exam.module.css'

// ─── 레벨 메타데이터 ───────────────────────────────────
const TOEIC_LEVELS: { level: ToeicLevel; label: string; score: string; desc: string }[] = [
  { level: 'toeic-200', label: 'Level 1', score: '~200점', desc: '기초 생활 어휘 및 단순 문장 이해' },
  { level: 'toeic-400', label: 'Level 2', score: '200~400점', desc: '일상적인 비즈니스 표현 및 기본 문법' },
  { level: 'toeic-600', label: 'Level 3', score: '400~600점', desc: '비즈니스 어휘, 수동태, 조건문' },
  { level: 'toeic-800', label: 'Level 4', score: '600~800점', desc: '고급 비즈니스 표현, 복잡한 문법 구조' },
  { level: 'toeic-900', label: 'Level 5', score: '800~990점', desc: '관용어, 전문 어휘, 도치·강조 구문' },
]

const JLPT_LEVELS: { level: JlptLevel; label: string; vocab: string; desc: string }[] = [
  { level: 'N5', label: 'N5', vocab: '약 800어', desc: '기초 히라가나·카타카나, 생활 어휘' },
  { level: 'N4', label: 'N4', vocab: '약 1,500어', desc: '기본 문법 패턴(て형, ない형, ～ために 등)' },
  { level: 'N3', label: 'N3', vocab: '약 3,750어', desc: '일상·사회적 화제, 복합 문법(～によって, ～ながら 등)' },
  { level: 'N2', label: 'N2', vocab: '약 6,000어', desc: '신문·잡지 수준, 고급 문법(～ざるを得ない 등)' },
  { level: 'N1', label: 'N1', vocab: '약 10,000어', desc: '논설·문학 수준, 최고급 표현(～にほかならない 등)' },
]

// ─── API 타입 ────────────────────────────────────────
interface WeakPointAnalysis {
  vocabulary: { correct: number; total: number; accuracy: number }
  grammar: { correct: number; total: number; accuracy: number }
  reading: { correct: number; total: number; accuracy: number }
  toeicByLevel: { level: ExamLevel; accuracy: number; attempts: number }[]
  jlptByLevel: { level: ExamLevel; accuracy: number; attempts: number }[]
  enrolledCount: number
}

type Screen = 'home' | 'quiz' | 'result'

interface StartedSession {
  sessionId: string
  questions: ExamQuestion[]
}

type HomeTab = 'toeic' | 'jlpt' | 'analysis'

// ─── 약점 분석 화면 ──────────────────────────────────
function AnalysisScreen({ analysis }: { analysis: WeakPointAnalysis }) {
  const cats = [
    { key: 'vocabulary', label: '어휘', color: '#3b82f6' },
    { key: 'grammar', label: '문법', color: '#8b5cf6' },
    { key: 'reading', label: '독해', color: '#f59e0b' },
  ] as const

  const hasData = cats.some((c) => analysis[c.key].total > 0)

  return (
    <div className={styles.analysisSection}>
      <h2 className={styles.analysisTitle}>약점 분석</h2>
      {!hasData ? (
        <p className={styles.analysisTip}>문제를 풀면 카테고리별 분석이 표시됩니다.</p>
      ) : (
        <>
          <div className={styles.catGrid}>
            {cats.map(({ key, label, color }) => {
              const s = analysis[key]
              return (
                <div key={key} className={styles.catCard}>
                  <div className={styles.catHeader}>
                    <span className={styles.catLabel}>{label}</span>
                    <span className={styles.catPct} style={{ color }}>{s.accuracy}%</span>
                  </div>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill} style={{ width: `${s.accuracy}%`, background: color }} />
                  </div>
                  <p className={styles.catDetail}>{s.correct} / {s.total} 정답</p>
                </div>
              )
            })}
          </div>

          <div className={styles.levelAnalysis}>
            <div className={styles.levelAnalysisBlock}>
              <h3 className={styles.levelAnalysisTitle}>🇺🇸 TOEIC 레벨별</h3>
              {analysis.toeicByLevel.map((l) => (
                <div key={l.level} className={styles.levelRow}>
                  <span className={styles.levelRowName}>{l.level.replace('toeic-', '')}점대</span>
                  <div className={styles.levelRowBar}>
                    <div
                      className={styles.levelRowFill}
                      style={{ width: `${l.accuracy}%`, background: l.accuracy >= 70 ? '#38a169' : '#e53e3e' }}
                    />
                  </div>
                  <span className={styles.levelRowPct}>{l.attempts > 0 ? `${l.accuracy}%` : '-'}</span>
                </div>
              ))}
            </div>
            <div className={styles.levelAnalysisBlock}>
              <h3 className={styles.levelAnalysisTitle}>🇯🇵 JLPT 레벨별</h3>
              {analysis.jlptByLevel.map((l) => (
                <div key={l.level} className={styles.levelRow}>
                  <span className={styles.levelRowName}>{l.level}</span>
                  <div className={styles.levelRowBar}>
                    <div
                      className={styles.levelRowFill}
                      style={{ width: `${l.accuracy}%`, background: l.accuracy >= 70 ? '#38a169' : '#e53e3e' }}
                    />
                  </div>
                  <span className={styles.levelRowPct}>{l.attempts > 0 ? `${l.accuracy}%` : '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── 홈 화면 ─────────────────────────────────────────
interface HomeScreenProps {
  stats: ExamStats | undefined
  analysis: WeakPointAnalysis | undefined
  onStart: (examType: ExamType, level: ExamLevel) => void
  isStarting: boolean
  generatingLevel: ExamLevel | null
  onGenerate: (examType: ExamType, level: ExamLevel) => void
}

function LevelBadge({ passed }: { passed: boolean }) {
  return passed ? <span className={styles.badgePassed}>합격</span> : null
}

function HomeScreen({ stats, analysis, onStart, isStarting, generatingLevel, onGenerate }: HomeScreenProps) {
  const [tab, setTab] = useState<HomeTab>('toeic')

  const statFor = (level: ExamLevel) => {
    const all = [...(stats?.toeic ?? []), ...(stats?.jlpt ?? [])]
    return all.find((s) => s.level === level)
  }

  const renderLevelCards = (
    levels: typeof TOEIC_LEVELS | typeof JLPT_LEVELS,
    examType: ExamType,
  ) => (
    <div className={styles.levelGrid}>
      {levels.map((meta) => {
        const s = statFor(meta.level)
        const isGenerating = generatingLevel === meta.level
        return (
          <div key={meta.level} className={styles.levelCard}>
            <div className={styles.levelHeader}>
              <div>
                <span className={`${styles.levelLabel} ${examType === 'jlpt' ? styles.jlptLabel : ''}`}>
                  {meta.label}
                </span>
                <span className={styles.levelScore}>
                  {'score' in meta ? meta.score : meta.vocab}
                </span>
              </div>
              {s?.passed && <LevelBadge passed={s.passed} />}
            </div>
            <p className={styles.levelDesc}>{meta.desc}</p>
            {s && s.attempts > 0 && (
              <div className={styles.levelProgress}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${s.bestScore}%` }} />
                </div>
                <span className={styles.progressText}>최고 {s.bestScore}% · {s.attempts}회 도전</span>
              </div>
            )}
            <div className={styles.cardActions}>
              <button
                className={styles.startBtn}
                onClick={() => onStart(examType, meta.level)}
                disabled={isStarting || isGenerating}
              >
                {isStarting ? '준비 중...' : '문제 풀기 →'}
              </button>
              <button
                className={styles.aiBtn}
                onClick={() => onGenerate(examType, meta.level)}
                disabled={isGenerating || isStarting}
                title="AI로 새 문제 5개 생성"
              >
                {isGenerating ? '생성 중...' : '✨ AI 생성'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.heroTitle}>시험 준비</h1>
        <p className={styles.heroDesc}>
          TOEIC·JLPT 단계별 문제를 풀고 실력을 확인하세요.<br />
          각 레벨 10문제, 70% 이상이면 합격입니다.
        </p>
      </div>

      <div className={styles.tabBar}>
        <button className={`${styles.tab} ${tab === 'toeic' ? styles.tabActive : ''}`} onClick={() => setTab('toeic')}>
          🇺🇸 TOEIC
        </button>
        <button className={`${styles.tab} ${tab === 'jlpt' ? styles.tabActive : ''}`} onClick={() => setTab('jlpt')}>
          🇯🇵 JLPT
        </button>
        <button className={`${styles.tab} ${tab === 'analysis' ? styles.tabActive : ''}`} onClick={() => setTab('analysis')}>
          📊 약점 분석
        </button>
      </div>

      {tab === 'toeic' && renderLevelCards(TOEIC_LEVELS, 'toeic')}
      {tab === 'jlpt' && renderLevelCards(JLPT_LEVELS, 'jlpt')}
      {tab === 'analysis' && <AnalysisScreen analysis={analysis ?? {
        vocabulary: { correct: 0, total: 0, accuracy: 0 },
        grammar: { correct: 0, total: 0, accuracy: 0 },
        reading: { correct: 0, total: 0, accuracy: 0 },
        toeicByLevel: TOEIC_LEVELS.map((l) => ({ level: l.level, accuracy: 0, attempts: 0 })),
        jlptByLevel: JLPT_LEVELS.map((l) => ({ level: l.level, accuracy: 0, attempts: 0 })),
        enrolledCount: 0,
      }} />}
    </div>
  )
}

// ─── 퀴즈 화면 ───────────────────────────────────────
interface QuizScreenProps {
  session: StartedSession
  examType: ExamType
  level: ExamLevel
  onSubmit: (answers: { questionId: string; selected: number }[]) => void
  isSubmitting: boolean
}

function QuizScreen({ session, examType, level, onSubmit, isSubmitting }: QuizScreenProps) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const { questions } = session
  const q = questions[current]
  const totalAnswered = Object.keys(answers).length
  const isAllAnswered = totalAnswered === questions.length

  if (!q) return null

  const OPTION_LABELS = ['A', 'B', 'C', 'D']
  const levelLabel = examType === 'toeic'
    ? TOEIC_LEVELS.find((l) => l.level === level)?.label ?? level
    : level

  return (
    <div className={styles.container}>
      <div className={styles.quizHeader}>
        <div className={styles.quizMeta}>
          <span className={styles.quizExamBadge}>
            {examType === 'toeic' ? '🇺🇸 TOEIC' : '🇯🇵 JLPT'} · {levelLabel}
          </span>
          <span className={styles.quizProgress}>{current + 1} / {questions.length}</span>
        </div>
        <div className={styles.quizProgressBar}>
          <div className={styles.quizProgressFill} style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          <span className={styles.questionNum}>Q{current + 1}</span>
          <span className={styles.categoryBadge}>{q.category === 'vocabulary' ? '어휘' : q.category === 'grammar' ? '문법' : '독해'}</span>
        </div>
        <p className={styles.questionText}>{q.question}</p>
        <div className={styles.options}>
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`${styles.option} ${answers[q.id] === idx ? styles.optionSelected : ''}`}
              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
            >
              <span className={styles.optionLabel}>{OPTION_LABELS[idx]}</span>
              <span className={styles.optionText}>{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.quizNav}>
        <button
          className={styles.navBtn}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← 이전
        </button>
        <div className={styles.navDots}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dot} ${idx === current ? styles.dotCurrent : ''} ${answers[questions[idx]?.id ?? ''] !== undefined ? styles.dotAnswered : ''}`}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
        {current < questions.length - 1 ? (
          <button className={styles.navBtn} onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
            다음 →
          </button>
        ) : (
          <button
            className={`${styles.navBtn} ${styles.submitBtn} ${!isAllAnswered ? styles.submitDisabled : ''}`}
            onClick={() => {
              if (!isAllAnswered) return
              onSubmit(questions.map((q) => ({ questionId: q.id, selected: answers[q.id] ?? 0 })))
            }}
            disabled={!isAllAnswered || isSubmitting}
          >
            {isSubmitting ? '채점 중...' : `제출 (${totalAnswered}/${questions.length})`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 결과 화면 ───────────────────────────────────────
interface ResultScreenProps {
  session: ExamSession & { answers: { questionId: string; selected: number; correct: boolean }[]; autoEnrolledCount: number }
  questions: ExamQuestion[]
  examType: ExamType
  level: ExamLevel
  onRetry: () => void
  onHome: () => void
}

function ResultScreen({ session, questions, examType, level, onRetry, onHome }: ResultScreenProps) {
  const [showDetail, setShowDetail] = useState(false)
  const pct = Math.round((session.score / session.totalQuestions) * 100)
  const passed = pct >= 70
  const qMap = new Map(questions.map((q) => [q.id, q]))
  const levelLabel = examType === 'toeic' ? TOEIC_LEVELS.find((l) => l.level === level)?.label ?? level : level

  return (
    <div className={styles.container}>
      <div className={`${styles.resultCard} ${passed ? styles.resultPassed : styles.resultFailed}`}>
        <div className={styles.resultIcon}>{passed ? '🎉' : '📚'}</div>
        <h2 className={styles.resultTitle}>{passed ? '합격!' : '더 연습해요'}</h2>
        <p className={styles.resultExam}>{examType === 'toeic' ? '🇺🇸 TOEIC' : '🇯🇵 JLPT'} · {levelLabel}</p>
        <div className={styles.resultScore}>
          <span className={styles.resultNum}>{session.score}</span>
          <span className={styles.resultDen}> / {session.totalQuestions}</span>
        </div>
        <div className={styles.resultPct} style={{ color: passed ? 'var(--color-primary)' : '#e53e3e' }}>
          {pct}%
        </div>
        <div className={styles.resultBar}>
          <div className={styles.resultBarFill} style={{ width: `${pct}%`, background: passed ? 'var(--color-primary)' : '#e53e3e' }} />
        </div>
        <p className={styles.passMark}>합격 기준: 70% 이상</p>
        {session.autoEnrolledCount > 0 && (
          <div className={styles.autoEnroll}>
            📖 오답 어휘 <strong>{session.autoEnrolledCount}개</strong>가 내 단어장에 자동 추가됐습니다.
          </div>
        )}
      </div>

      <div className={styles.resultActions}>
        <button className={styles.retryBtn} onClick={onRetry}>다시 도전</button>
        <button className={styles.homeBtn} onClick={onHome}>레벨 선택으로</button>
      </div>

      <button className={styles.toggleDetail} onClick={() => setShowDetail((v) => !v)}>
        {showDetail ? '해설 닫기 ▲' : '문제별 해설 보기 ▼'}
      </button>

      {showDetail && (
        <div className={styles.detailList}>
          {session.answers.map((ans, idx) => {
            const q = qMap.get(ans.questionId)
            if (!q) return null
            return (
              <div key={ans.questionId} className={`${styles.detailItem} ${ans.correct ? styles.detailCorrect : styles.detailWrong}`}>
                <div className={styles.detailHeader}>
                  <span className={styles.detailNum}>Q{idx + 1} · {q.category === 'vocabulary' ? '어휘' : q.category === 'grammar' ? '문법' : '독해'}</span>
                  <span className={styles.detailResult}>{ans.correct ? '✓ 정답' : '✗ 오답'}</span>
                </div>
                <p className={styles.detailQuestion}>{q.question}</p>
                <div className={styles.detailOptions}>
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`${styles.detailOpt} ${i === q.answer ? styles.detailOptCorrect : ''} ${i === ans.selected && !ans.correct ? styles.detailOptWrong : ''}`}
                    >
                      {['A', 'B', 'C', 'D'][i]}. {opt}
                      {i === q.answer && <span className={styles.correctMark}> ← 정답</span>}
                    </div>
                  ))}
                </div>
                <p className={styles.detailExplanation}>{q.explanation}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────
export function ExamPage() {
  const qc = useQueryClient()
  const [screen, setScreen] = useState<Screen>('home')
  const [examType, setExamType] = useState<ExamType>('toeic')
  const [level, setLevel] = useState<ExamLevel>('toeic-200')
  const [session, setSession] = useState<StartedSession | null>(null)
  const [generatingLevel, setGeneratingLevel] = useState<ExamLevel | null>(null)
  const [completedSession, setCompletedSession] = useState<{
    session: ExamSession & { answers: { questionId: string; selected: number; correct: boolean }[]; autoEnrolledCount: number }
    questions: ExamQuestion[]
  } | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['exam', 'stats'],
    queryFn: () => api.get<ExamStats>('/exam/stats'),
  })

  const { data: analysis } = useQuery({
    queryKey: ['exam', 'analysis'],
    queryFn: () => api.get<WeakPointAnalysis>('/exam/analysis'),
  })

  const startMutation = useMutation({
    mutationFn: (body: { examType: ExamType; level: ExamLevel }) =>
      api.post<StartedSession>('/exam/sessions', body),
    onSuccess: (data, vars) => {
      setSession(data)
      setExamType(vars.examType)
      setLevel(vars.level)
      setScreen('quiz')
    },
  })

  const submitMutation = useMutation({
    mutationFn: ({ sessionId, answers }: { sessionId: string; answers: { questionId: string; selected: number }[] }) =>
      api.post<ExamSession & { answers: { questionId: string; selected: number; correct: boolean }[]; autoEnrolledCount: number }>(
        `/exam/sessions/${sessionId}/submit`,
        { answers },
      ),
    onSuccess: (data) => {
      setCompletedSession({ session: data, questions: session?.questions ?? [] })
      setScreen('result')
      void qc.invalidateQueries({ queryKey: ['exam', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['exam', 'analysis'] })
      void qc.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })

  const generateMutation = useMutation({
    mutationFn: (body: { examType: ExamType; level: ExamLevel; count: number }) =>
      api.post<ExamQuestion[]>('/exam/generate', body),
    onSuccess: (_, vars) => {
      setGeneratingLevel(null)
      alert(`✨ ${vars.level} 레벨 문제 5개가 추가됐습니다!`)
    },
    onError: () => setGeneratingLevel(null),
  })

  const handleStart = (et: ExamType, lv: ExamLevel) => {
    startMutation.mutate({ examType: et, level: lv })
  }

  const handleGenerate = (et: ExamType, lv: ExamLevel) => {
    setGeneratingLevel(lv)
    generateMutation.mutate({ examType: et, level: lv, count: 5 })
  }

  const handleSubmit = (answers: { questionId: string; selected: number }[]) => {
    if (!session) return
    submitMutation.mutate({ sessionId: session.sessionId, answers })
  }

  const handleHome = () => {
    setScreen('home')
    setSession(null)
    setCompletedSession(null)
  }

  if (screen === 'quiz' && session) {
    return (
      <QuizScreen
        session={session}
        examType={examType}
        level={level}
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    )
  }

  if (screen === 'result' && completedSession) {
    return (
      <ResultScreen
        session={completedSession.session}
        questions={completedSession.questions}
        examType={examType}
        level={level}
        onRetry={() => startMutation.mutate({ examType, level })}
        onHome={handleHome}
      />
    )
  }

  return (
    <HomeScreen
      stats={stats}
      analysis={analysis}
      onStart={handleStart}
      isStarting={startMutation.isPending}
      generatingLevel={generatingLevel}
      onGenerate={handleGenerate}
    />
  )
}
