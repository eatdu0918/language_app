import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak, SpeechRecorder, transcribeAudio } from '../lib/speech'
import type { Document, SupportedLanguage, ProficiencyLevel } from '@language-app/shared'
import styles from './documents.module.css'

export function DocumentsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [selected, setSelected] = useState<Document | null>(null)
  const [adapted, setAdapted] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorder] = useState(() => new SpeechRecorder())
  const [transcript, setTranscript] = useState('')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', lang],
    queryFn: () => api.get<Document[]>(`/documents?language=${lang}`),
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
                <option key={l} value={l}>{l}</option>
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
          <button className={lang === 'en' ? styles.active : ''} onClick={() => setLang('en')}>영어</button>
          <button className={lang === 'ja' ? styles.active : ''} onClick={() => setLang('ja')}>일본어</button>
        </div>
      </div>

      {isLoading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : (
        <div className={styles.grid}>
          {documents?.map((doc) => (
            <button key={doc.id} className={styles.docCard} onClick={() => setSelected(doc)}>
              <span className={styles.level}>{doc.level}</span>
              <h2>{doc.title}</h2>
              <p>{doc.estimatedReadingMinutes}분 읽기</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
