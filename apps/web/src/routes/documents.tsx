import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak, SpeechRecorder, transcribeAudio } from '../lib/speech'
import type { Document, SupportedLanguage, ProficiencyLevel } from '@language-app/shared'
import styles from './documents.module.css'

const LEVELS: Array<{ value: ProficiencyLevel | ''; label: string }> = [
  { value: '', label: '전체' },
  { value: 'beginner', label: '초급' },
  { value: 'elementary', label: '초중급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
]

export function DocumentsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [levelFilter, setLevelFilter] = useState<ProficiencyLevel | ''>('')
  const [selected, setSelected] = useState<Document | null>(null)
  const [adapted, setAdapted] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorder] = useState(() => new SpeechRecorder())
  const [transcript, setTranscript] = useState('')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', lang, levelFilter],
    queryFn: () => {
      const params = new URLSearchParams({ language: lang })
      if (levelFilter) params.set('level', levelFilter)
      return api.get<Document[]>(`/documents?${params.toString()}`)
    },
  })

  const adaptMutation = useMutation({
    mutationFn: ({ id, level }: { id: string; level: ProficiencyLevel }) =>
      api.post<{ text: string }>(`/documents/${id}/adapt?level=${level}`),
    onSuccess: (data) => setAdapted(data.text),
  })

  const handleReadAloud = async () => {
    if (recording) {
      const blob = await recorder.stop()
      setRecording(false)
      const result = await transcribeAudio(blob, lang)
      setTranscript(result.text)
    } else {
      await recorder.start()
      setRecording(true)
      setTranscript('')
    }
  }

  if (selected) {
    const content = adapted ?? selected.content
    return (
      <div className={styles.reader}>
        <button className={styles.back} onClick={() => { setSelected(null); setAdapted(null); setTranscript('') }}>← 목록</button>
        <div className={styles.readerHeader}>
          <h1>{selected.title}</h1>
          <div className={styles.actions}>
            <button onClick={() => speak(content, lang)}>🔊 읽어주기</button>
            <button className={recording ? styles.recording : ''} onClick={() => void handleReadAloud()}>
              {recording ? '⏹ 녹음 중지' : '🎙 따라 읽기'}
            </button>
            <select onChange={(e) => adaptMutation.mutate({ id: selected.id, level: e.target.value as ProficiencyLevel })}>
              <option value="">레벨 조정</option>
              {(['beginner', 'elementary', 'intermediate', 'advanced'] as ProficiencyLevel[]).map((l) => (
                <option key={l} value={l}>{LEVELS.find((lv) => lv.value === l)?.label ?? l}</option>
              ))}
            </select>
          </div>
        </div>
        <p className={styles.content}>{content}</p>
        {transcript && (
          <div className={styles.transcriptBox}>
            <p className={styles.transcriptLabel}>내 발음 인식 결과</p>
            <p>{transcript}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>문서 읽기</h1>
        <div className={styles.langSwitch}>
          <button className={lang === 'en' ? styles.active : ''} onClick={() => { setLang('en'); setLevelFilter('') }}>영어</button>
          <button className={lang === 'ja' ? styles.active : ''} onClick={() => { setLang('ja'); setLevelFilter('') }}>일본어</button>
        </div>
      </div>

      <div className={styles.levelFilter}>
        {LEVELS.map((lv) => (
          <button
            key={lv.value}
            className={levelFilter === lv.value ? styles.levelActive : ''}
            onClick={() => setLevelFilter(lv.value)}
          >
            {lv.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : documents?.length === 0 ? (
        <p className={styles.loading}>해당 레벨의 문서가 없습니다.</p>
      ) : (
        <div className={styles.grid}>
          {documents?.map((doc) => (
            <button key={doc.id} className={styles.docCard} onClick={() => setSelected(doc)}>
              <span className={styles.level}>{LEVELS.find((lv) => lv.value === doc.level)?.label ?? doc.level}</span>
              <h2>{doc.title}</h2>
              <p>{doc.estimatedReadingMinutes}분 읽기</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
