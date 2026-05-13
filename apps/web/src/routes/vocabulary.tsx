import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak } from '../lib/speech'
import type { VocabularyProgress, VocabularyWord, SupportedLanguage, PaginatedResponse } from '@language-app/shared'
import styles from './vocabulary.module.css'

const QUALITY_LABELS = ['다시', '어려움', '애매', '기억', '쉬움', '완벽']

type Tab = 'review' | 'browse'

export function VocabularyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('review')
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [bankPage, setBankPage] = useState(1)

  const { data: dueWords, isLoading: dueLoading } = useQuery({
    queryKey: ['vocabulary', 'due', lang],
    queryFn: () => api.get<VocabularyProgress[]>(`/vocabulary/due?language=${lang}`),
    enabled: tab === 'review',
  })

  const { data: wordBankPage, isLoading: bankLoading } = useQuery({
    queryKey: ['vocabulary', 'words', lang, bankPage],
    queryFn: () => api.get<PaginatedResponse<VocabularyWord>>(`/vocabulary/words?language=${lang}&page=${bankPage}&limit=20`),
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

  const bankWords = wordBankPage?.data
  const bankTotalPages = wordBankPage ? Math.ceil(wordBankPage.total / wordBankPage.limit) : 1

  const handleLangChange = (l: SupportedLanguage) => {
    setLang(l)
    setCurrent(0)
    setFlipped(false)
    setBankPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button className={tab === 'review' ? styles.activeTab : styles.tab} onClick={() => setTab('review')}>복습</button>
          <button className={tab === 'browse' ? styles.activeTab : styles.tab} onClick={() => setTab('browse')}>단어 뱅크</button>
        </div>
        <div className={styles.langSwitch}>
          <button className={lang === 'en' ? styles.active : ''} onClick={() => handleLangChange('en')}>영어</button>
          <button className={lang === 'ja' ? styles.active : ''} onClick={() => handleLangChange('ja')}>일본어</button>
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
