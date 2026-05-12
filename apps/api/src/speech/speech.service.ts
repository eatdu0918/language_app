import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { TranscribeResponse, SupportedLanguage } from '@language-app/shared'

@Injectable()
export class SpeechService {
  private readonly whisperUrl: string

  constructor(config: ConfigService) {
    this.whisperUrl = config.get('WHISPER_BASE_URL', 'http://localhost:8000')
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    language?: SupportedLanguage,
  ): Promise<TranscribeResponse> {
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: mimeType }), 'audio.webm')
    if (language) formData.append('language', language)

    const response = await fetch(`${this.whisperUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new BadRequestException(`Whisper service error: ${response.statusText}`)
    }

    return response.json() as Promise<TranscribeResponse>
  }
}
