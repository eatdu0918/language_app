import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak, SpeechRecorder, transcribeAudio } from '../lib/speech'
import type { SupportedLanguage, ConversationSession } from '@language-app/shared'
import styles from './conversation.module.css'

const SCENARIOS = [
  { value: 'free', label: '자유 대화' },
  { value: 'interview', label: '인터뷰' },
  { value: 'shopping', label: '쇼핑' },
  { value: 'restaurant', label: '레스토랑' },
]

export function ConversationPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [scenario, setScenario] = useState('free')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [recording, setRecording] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [recorder] = useState(() => new SpeechRecorder())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startMutation = useMutation({
    mutationFn: () => api.post<ConversationSession>('/conversation/sessions', { language: lang, scenario }),
    onSuccess: (data) => {
      setSessionId(data.id)
      setMessages([])
    },
  })

  const sendMessage = async (text: string) => {
    if (!sessionId) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    let aiText = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '...' }])

    const token = localStorage.getItem('accessToken')
    const res = await fetch(`/api/v1/conversation/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ text }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter((l) => l.startsWith('data:'))
      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') break
        const parsed = JSON.parse(data) as { chunk: string }
        aiText += parsed.chunk
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: aiText }])
      }
    }

    if (autoSpeak && aiText) speak(aiText, lang)
  }

  const handleMic = async () => {
    if (recording) {
      const blob = await recorder.stop()
      setRecording(false)
      const result = await transcribeAudio(blob, lang)
      await sendMessage(result.text)
    } else {
      await recorder.start()
      setRecording(true)
    }
  }

  const endMutation = useMutation({
    mutationFn: () => api.post<{ analysis: string }>(`/conversation/sessions/${sessionId}/end`),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'system', content: `📊 대화 분석\n${data.analysis}` }])
      setSessionId(null)
    },
  })

  if (!sessionId) {
    return (
      <div className={styles.setup}>
        <h1>회화 연습</h1>
        <div className={styles.option}>
          <label>언어</label>
          <div className={styles.btnGroup}>
            <button className={lang === 'en' ? styles.active : ''} onClick={() => setLang('en')}>영어</button>
            <button className={lang === 'ja' ? styles.active : ''} onClick={() => setLang('ja')}>일본어</button>
          </div>
        </div>
        <div className={styles.option}>
          <label>시나리오</label>
          <div className={styles.btnGroup}>
            {SCENARIOS.map((s) => (
              <button key={s.value} className={scenario === s.value ? styles.active : ''} onClick={() => setScenario(s.value)}>{s.label}</button>
            ))}
          </div>
        </div>
        <button className={styles.startBtn} onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
          {startMutation.isPending ? '시작 중...' : '대화 시작'}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.chat}>
      <div className={styles.chatHeader}>
        <h1>회화 연습 — {lang === 'en' ? '영어' : '일본어'}</h1>
        <div className={styles.chatActions}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
            자동 재생
          </label>
          <button className={styles.endBtn} onClick={() => endMutation.mutate()} disabled={endMutation.isPending}>
            대화 종료
          </button>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role as 'user' | 'assistant' | 'system']}`}>
            <p>{msg.content}</p>
            {msg.role === 'assistant' && (
              <button className={styles.speakBtn} onClick={() => speak(msg.content, lang)}>🔊</button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <button
          className={`${styles.micBtn} ${recording ? styles.recording : ''}`}
          onClick={() => void handleMic()}
        >
          {recording ? '⏹' : '🎙'}
        </button>
        <p className={styles.hint}>{recording ? '말하고 있습니다...' : '마이크 버튼을 눌러 말하세요'}</p>
      </div>
    </div>
  )
}
