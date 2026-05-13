import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak } from '../lib/speech'
import type { VocabularyProgress, SupportedLanguage, ProficiencyLevel } from '@language-app/shared'
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

export function VocabularyPage() {
  const qc = useQueryClient()
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<AddWordForm>(EMPTY_FORM)

  const { data: words, isLoading } = useQuery({
    queryKey: ['vocabulary', 'due', lang],
    queryFn: () => api.get<VocabularyProgress[]>(`/vocabulary/due?language=${lang}`),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ wordId, quality }: { wordId: string; quality: number }) =>
      api.post(`/vocabulary/${wordId}/review`, { quality }),
    onSuccess: () => {
      const next = current + 1
      if (words && next >= words.length) {
        void qc.invalidateQueries({ queryKey: ['vocabulary', 'due', lang] })
        setCurrent(0)
      } else {
        setCurrent(next)
      }
      setFlipped(false)
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
      void qc.invalidateQueries({ queryKey: ['vocabulary', 'due', lang] })
      setForm(EMPTY_FORM)
      setShowAddForm(false)
    },
  })

  const switchLang = (l: SupportedLanguage) => {
    setLang(l)
    setCurrent(0)
    setFlipped(false)
  }

  if (isLoading) return <div className={styles.center}>불러오는 중...</div>

  const currentWord = words?.[current]?.word

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>단어 복습</h1>
        <div className={styles.headerRight}>
          <div className={styles.langSwitch}>
            <button className={lang === 'en' ? styles.active : ''} onClick={() => switchLang('en')}>영어</button>
            <button className={lang === 'ja' ? styles.active : ''} onClick={() => switchLang('ja')}>일본어</button>
          </div>
          <button className={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '닫기' : '+ 단어 추가'}
          </button>
        </div>
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

      {!words || words.length === 0 ? (
        <div className={styles.center}>
          <p>🎉 오늘 복습할 단어가 없습니다!</p>
        </div>
      ) : (
        <>
          <p className={styles.progress}>{current + 1} / {words.length}</p>

          {currentWord && (
            <div
              className={`${styles.card} ${flipped ? styles.flipped : ''}`}
              onClick={() => setFlipped(!flipped)}
            >
              <div className={styles.front}>
                <p className={styles.word}>{currentWord.word}</p>
                {currentWord.reading && <p className={styles.reading}>{currentWord.reading}</p>}
                <button
                  className={styles.speakBtn}
                  onClick={(e) => { e.stopPropagation(); speak(currentWord.word, lang) }}
                >
                  🔊
                </button>
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
                  onClick={() => reviewMutation.mutate({ wordId: words[current]!.word.id, quality: i })}
                  disabled={reviewMutation.isPending}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
