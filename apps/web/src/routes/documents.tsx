import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { speak, SpeechRecorder, transcribeAudio } from '../lib/speech'
import type { Document, SupportedLanguage, ProficiencyLevel, PaginatedResponse } from '@language-app/shared'
import styles from './documents.module.css'

interface CreateDocumentForm {
  title: string
  content: string
  language: SupportedLanguage
  level: ProficiencyLevel
  tags: string
}

const LEVELS: ProficiencyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced']

export function DocumentsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [selected, setSelected] = useState<Document | null>(null)
  const [adapted, setAdapted] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorder] = useState(() => new SpeechRecorder())
  const [transcript, setTranscript] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<CreateDocumentForm>({
    title: '',
    content: '',
    language: 'en',
    level: 'beginner',
    tags: '',
  })

  const queryClient = useQueryClient()

  const { data: documentsPage, isLoading } = useQuery({
    queryKey: ['documents', lang, page],
    queryFn: () => api.get<PaginatedResponse<Document>>(`/documents?language=${lang}&page=${page}&limit=12`),
  })

  const adaptMutation = useMutation({
    mutationFn: ({ id, level }: { id: string; level: ProficiencyLevel }) =>
      api.post<{ text: string }>(`/documents/${id}/adapt?level=${level}`),
    onSuccess: (data) => setAdapted(data.text),
  })

  const documents = documentsPage?.data
  const totalPages = documentsPage ? Math.ceil(documentsPage.total / documentsPage.limit) : 1

  const createMutation = useMutation({
    mutationFn: (data: Omit<CreateDocumentForm, 'tags'> & { tags: string[] }) =>
      api.post<Document>('/documents', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
      setPage(1)
      setShowForm(false)
      setForm({ title: '', content: '', language: 'en', level: 'beginner', tags: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/documents/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
      setSelected(null)
    },
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
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
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              className={styles.deleteBtn}
              onClick={() => { if (confirm('문서를 삭제할까요?')) deleteMutation.mutate(selected.id) }}
            >
              삭제
            </button>
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
        <div className={styles.headerRight}>
          <div className={styles.langSwitch}>
            <button className={lang === 'en' ? styles.active : ''} onClick={() => { setLang('en'); setPage(1) }}>영어</button>
            <button className={lang === 'ja' ? styles.active : ''} onClick={() => { setLang('ja'); setPage(1) }}>일본어</button>
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ 문서 추가</button>
        </div>
      </div>

      {isLoading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : (
        <>
          <div className={styles.grid}>
            {documents?.map((doc) => (
              <button key={doc.id} className={styles.docCard} onClick={() => setSelected(doc)}>
                <span className={styles.level}>{doc.level}</span>
                <h2>{doc.title}</h2>
                <p>{doc.estimatedReadingMinutes}분 읽기</p>
              </button>
            ))}
            {documents?.length === 0 && (
              <p className={styles.empty}>문서가 없습니다. 문서를 추가해보세요.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setPage(page - 1)} disabled={page <= 1}>이전</button>
              <span>{page} / {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>다음</button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>새 문서 추가</h2>
            <form onSubmit={handleCreateSubmit} className={styles.modalForm}>
              <label className={styles.label}>제목</label>
              <input
                className={styles.input}
                type="text"
                placeholder="문서 제목"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>언어</label>
                  <select
                    className={styles.select}
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as SupportedLanguage })}
                  >
                    <option value="en">영어</option>
                    <option value="ja">일본어</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>레벨</label>
                  <select
                    className={styles.select}
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value as ProficiencyLevel })}
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <label className={styles.label}>태그 (쉼표 구분)</label>
              <input
                className={styles.input}
                type="text"
                placeholder="news, business, travel"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />

              <label className={styles.label}>내용</label>
              <textarea
                className={styles.textarea}
                placeholder="문서 내용을 입력하세요..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={10}
              />

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>취소</button>
                <button type="submit" className={styles.submitBtn} disabled={createMutation.isPending}>
                  {createMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
              {createMutation.isError && (
                <p className={styles.error}>저장에 실패했습니다. 다시 시도해주세요.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
