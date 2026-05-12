import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak } from '../lib/speech'
import type { VocabularyProgress, SupportedLanguage } from '@language-app/shared'
import styles from './vocabulary.module.css'

const QUALITY_LABELS = ['다시', '어려움', '애매', '기억', '쉬움', '완벽']

export function VocabularyPage() {
  const qc = useQueryClient()
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

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

  if (isLoading) return <div className={styles.center}>불러오는 중...</div>

  const currentWord = words?.[current]?.word

  if (!words || words.length === 0) {
    return (
      <div className={styles.center}>
        <p>🎉 오늘 복습할 단어가 없습니다!</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>단어 복습</h1>
        <div className={styles.langSwitch}>
          <button className={lang === 'en' ? styles.active : ''} onClick={() => { setLang('en'); setCurrent(0); setFlipped(false) }}>영어</button>
          <button className={lang === 'ja' ? styles.active : ''} onClick={() => { setLang('ja'); setCurrent(0); setFlipped(false) }}>일본어</button>
        </div>
      </div>

      <p className={styles.progress}>{current + 1} / {words.length}</p>

      {currentWord && (
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(!flipped)}>
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
              onClick={() => reviewMutation.mutate({ wordId: words[current]!.word.id, quality: i })}
              disabled={reviewMutation.isPending}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// useState import 누락 방지
import { useState } from 'react'
