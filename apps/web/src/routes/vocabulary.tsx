import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak } from '../lib/speech'
import type { VocabularyProgress, VocabularyWord, SupportedLanguage, PaginatedResponse, ProficiencyLevel } from '@language-app/shared'
import styles from './vocabulary.module.css'

const QUALITY_LABELS = ['다시', '어려움', '애매', '기억', '쉬움', '완벽']
const LEVELS: ProficiencyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced']
const LEVEL_KO: Record<ProficiencyLevel, string> = {
  beginner: '초급',
  elementary: '초중급',
  intermediate: '중급',
  advanced: '고급',
  native: '원어민',
}

interface AddWordForm {
  word: string
  reading: string
  meaning: string
  exampleSentence: string
  exampleTranslation: string
  level: ProficiencyLevel
}

const EMPTY_FORM: AddWordForm = {
  word: '',
  reading: '',
  meaning: '',
  exampleSentence: '',
  exampleTranslation: '',
  level: 'beginner',
}

type Tab = 'review' | 'browse'

const EN_EXAM_TAGS = ['전체', 'TOEIC-200', 'TOEIC-400', 'TOEIC-600', 'TOEIC-800', 'TOEIC-900'] as const
const JA_EXAM_TAGS = ['전체', 'JLPT-N5', 'JLPT-N4', 'JLPT-N3', 'JLPT-N2', 'JLPT-N1'] as const

export function VocabularyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('review')
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [bankPage, setBankPage] = useState(1)
  const [examTag, setExamTag] = useState<string>('전체')
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<AddWordForm>(EMPTY_FORM)

  const activeTag = examTag === '전체' ? undefined : examTag

  const { data: dueWords, isLoading: dueLoading } = useQuery({
    queryKey: ['vocabulary', 'due', lang],
    queryFn: () => api.get<VocabularyProgress[]>(`/vocabulary/due?language=${lang}`),
    enabled: tab === 'review',
  })

  const { data: wordBankPage, isLoading: bankLoading } = useQuery({
    queryKey: ['vocabulary', 'words', lang, bankPage, activeTag],
    queryFn: () => {
      const params = new URLSearchParams({ language: lang, page: String(bankPage), limit: '20' })
      if (activeTag) params.set('tag', activeTag)
      return api.get<PaginatedResponse<VocabularyWord>>(`/vocabulary/words?${params.toString()}`)
    },
    enabled: tab === 'browse',
  })

  const reviewMutation = useMutation({
    mutationFn: ({ wordId, quality }: { wordId: string; quality: number }) =>
      api.post(`/vocabulary/${wordId}/review`, { quality }),
    onSuccess: () => {
      const next = current + 1
      if (dueWords && next >= dueWords.length) {
        void qc.invalidateQueries({ queryKey: ['vocabulary', 'due', lang] })
        setCurrent(0)
      } else {
        setCurrent(next)
      }
      setFlipped(false)
    },
  })

  const enrollMutation = useMutation({
    mutationFn: (wordId: string) =>
      api.post<VocabularyProgress>(`/vocabulary/words/${wordId}/enroll`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary', 'due', lang] })
    },
  })

  const addWordMutation = useMutation({
    mutationFn: () =>
      api.post('/vocabulary/words', {
        ...form,
        reading: form.reading || undefined,
        tags: [],
        language: lang,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary', 'words', lang] })
      setForm(EMPTY_FORM)
      setShowAddForm(false)
    },
  })

  const bankWords = wordBankPage?.data
  const bankTotalPages = wordBankPage ? Math.ceil(wordBankPage.total / wordBankPage.limit) : 1

  const handleLangChange = (l: SupportedLanguage) => {
    setLang(l)
    setCurrent(0)
    setFlipped(false)
    setBankPage(1)
    setExamTag('전체')
  }

  const examTags = lang === 'en' ? EN_EXAM_TAGS : JA_EXAM_TAGS

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button className={tab === 'review' ? styles.activeTab : styles.tab} onClick={() => setTab('review')}>복습</button>
          <button className={tab === 'browse' ? styles.activeTab : styles.tab} onClick={() => setTab('browse')}>단어 뱅크</button>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.langSwitch}>
            <button className={lang === 'en' ? styles.active : ''} onClick={() => handleLangChange('en')}>영어</button>
            <button className={lang === 'ja' ? styles.active : ''} onClick={() => handleLangChange('ja')}>일본어</button>
          </div>
          {tab === 'browse' && (
            <button className={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? '닫기' : '+ 단어 추가'}
            </button>
          )}
        </div>
      </div>

      {tab === 'review' && (
        <ReviewTab
          words={dueWords}
          isLoading={dueLoading}
          current={current}
          flipped={flipped}
          lang={lang}
          onFlip={() => setFlipped(!flipped)}
          onReview={(wordId, quality) => reviewMutation.mutate({ wordId, quality })}
          isPending={reviewMutation.isPending}
        />
      )}

      {tab === 'browse' && (
        <>
          {/* 시험 레벨 필터 */}
          <div className={styles.examTagBar}>
            {examTags.map((tag) => (
              <button
                key={tag}
                className={`${styles.examTag} ${examTag === tag ? styles.examTagActive : ''}`}
                onClick={() => { setExamTag(tag); setBankPage(1) }}
              >
                {tag}
              </button>
            ))}
          </div>

          {showAddForm && (
            <form
              className={styles.addForm}
              onSubmit={(e) => { e.preventDefault(); addWordMutation.mutate() }}
            >
              <h2 className={styles.addFormTitle}>새 단어 추가 ({lang === 'en' ? '영어' : '일본어'})</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>단어 *</label>
                  <input
                    value={form.word}
                    onChange={(e) => setForm({ ...form, word: e.target.value })}
                    placeholder={lang === 'ja' ? '例: 食べる' : 'e.g. apple'}
                    required
                  />
                </div>
                {lang === 'ja' && (
                  <div className={styles.formGroup}>
                    <label>읽기 (후리가나)</label>
                    <input
                      value={form.reading}
                      onChange={(e) => setForm({ ...form, reading: e.target.value })}
                      placeholder="例: たべる"
                    />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>한국어 뜻 *</label>
                  <input
                    value={form.meaning}
                    onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                    placeholder="예: 먹다"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>예문 *</label>
                  <input
                    value={form.exampleSentence}
                    onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })}
                    placeholder={lang === 'ja' ? '例: 毎日ごはんを食べる。' : 'e.g. I eat breakfast every day.'}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>예문 번역 *</label>
                  <input
                    value={form.exampleTranslation}
                    onChange={(e) => setForm({ ...form, exampleTranslation: e.target.value })}
                    placeholder="예: 매일 밥을 먹는다."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>레벨</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value as ProficiencyLevel })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{LEVEL_KO[l]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM) }}>
                  취소
                </button>
                <button type="submit" className={styles.submitBtn} disabled={addWordMutation.isPending}>
                  {addWordMutation.isPending ? '추가 중...' : '단어 추가'}
                </button>
              </div>
              {addWordMutation.isError && (
                <p className={styles.formError}>추가에 실패했습니다. 다시 시도해 주세요.</p>
              )}
            </form>
          )}
          <BrowseTab
            words={bankWords}
            isLoading={bankLoading}
            lang={lang}
            page={bankPage}
            totalPages={bankTotalPages}
            onPageChange={setBankPage}
            onEnroll={(id) => enrollMutation.mutate(id)}
            enrollingId={enrollMutation.isPending ? enrollMutation.variables : null}
          />
        </>
      )}
    </div>
  )
}

interface ReviewTabProps {
  words: VocabularyProgress[] | undefined
  isLoading: boolean
  current: number
  flipped: boolean
  lang: SupportedLanguage
  onFlip: () => void
  onReview: (wordId: string, quality: number) => void
  isPending: boolean
}

function ReviewTab({ words, isLoading, current, flipped, lang, onFlip, onReview, isPending }: ReviewTabProps) {
  if (isLoading) return <div className={styles.center}>불러오는 중...</div>

  if (!words || words.length === 0) {
    return (
      <div className={styles.center}>
        <p>오늘 복습할 단어가 없습니다. 단어 뱅크에서 단어를 추가하세요.</p>
      </div>
    )
  }

  const currentWord = words[current]?.word

  return (
    <>
      <p className={styles.progress}>{current + 1} / {words.length}</p>

      {currentWord && (
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`} onClick={onFlip}>
          <div className={styles.front}>
            <p className={styles.word}>{currentWord.word}</p>
            {currentWord.reading && <p className={styles.reading}>{currentWord.reading}</p>}
            <button className={styles.speakBtn} onClick={(e) => { e.stopPropagation(); speak(currentWord.word, lang) }}>🔊</button>
          </div>
          <div className={styles.back}>
            <p className={styles.meaning}>{currentWord.meaning}</p>
            <p className={styles.example}>{currentWord.exampleSentence}</p>
            <p className={styles.translation}>{currentWord.exampleTranslation}</p>
          </div>
        </div>
      )}

      {flipped && words[current] && (
        <div className={styles.buttons}>
          {QUALITY_LABELS.map((label, i) => (
            <button
              key={i}
              className={styles.qualityBtn}
              onClick={() => onReview(words[current]!.word.id, i)}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

interface BrowseTabProps {
  words: VocabularyWord[] | undefined
  isLoading: boolean
  lang: SupportedLanguage
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  onEnroll: (id: string) => void
  enrollingId: string | null
}

function BrowseTab({ words, isLoading, lang, page, totalPages, onPageChange, onEnroll, enrollingId }: BrowseTabProps) {
  if (isLoading) return <div className={styles.center}>불러오는 중...</div>

  if (!words || words.length === 0) {
    return <div className={styles.center}>단어가 없습니다.</div>
  }

  return (
    <>
      <div className={styles.wordList}>
        {words.map((w) => (
          <div key={w.id} className={styles.wordRow}>
            <div className={styles.wordInfo}>
              <span className={styles.wordText}>{w.word}</span>
              {w.reading && <span className={styles.wordReading}>{w.reading}</span>}
              <span className={styles.wordMeaning}>{w.meaning}</span>
              <span className={styles.wordLevel}>{w.level}</span>
            </div>
            <div className={styles.wordActions}>
              <button className={styles.speakBtnSm} onClick={() => speak(w.word, lang)}>🔊</button>
              <button
                className={styles.enrollBtn}
                onClick={() => onEnroll(w.id)}
                disabled={enrollingId === w.id}
              >
                {enrollingId === w.id ? '추가 중...' : '학습하기'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>이전</button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>다음</button>
        </div>
      )}
    </>
  )
}
