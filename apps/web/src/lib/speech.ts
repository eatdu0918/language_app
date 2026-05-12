import type { SupportedLanguage, TranscribeResponse } from '@language-app/shared'

export class SpeechRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.chunks = []
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(250)
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) throw new Error('Not recording')
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        this.mediaRecorder?.stream.getTracks().forEach((t) => t.stop())
        resolve(blob)
      }
      this.mediaRecorder.stop()
    })
  }
}

export async function transcribeAudio(
  blob: Blob,
  language?: SupportedLanguage,
): Promise<TranscribeResponse> {
  const formData = new FormData()
  formData.append('file', blob, 'audio.webm')

  const token = localStorage.getItem('accessToken')
  const url = `/api/v1/speech/transcribe${language ? `?language=${language}` : ''}`
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) throw new Error('Transcription failed')
  return res.json() as Promise<TranscribeResponse>
}

export function speak(text: string, language: SupportedLanguage): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language === 'en' ? 'en-US' : 'ja-JP'
  utterance.rate = 0.9
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}
