import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AIMessage, AIOptions, AIProvider } from '@language-app/shared'

@Injectable()
export class OllamaProvider implements AIProvider {
  private readonly baseUrl: string
  private readonly defaultModel: string
  private readonly logger = new Logger(OllamaProvider.name)

  constructor(config: ConfigService) {
    this.baseUrl = config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    this.defaultModel = config.get('OLLAMA_MODEL', 'llama3.2')
  }

  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`)
    }

    const data = (await response.json()) as { message: { content: string } }
    return data.message.content
  }

  async *stream(messages: AIMessage[], options?: AIOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        messages,
        stream: true,
        options: { temperature: options?.temperature ?? 0.7 },
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Ollama stream error: ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          const chunk = JSON.parse(line) as { message?: { content: string }; done: boolean }
          if (chunk.message?.content) yield chunk.message.content
          if (chunk.done) return
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
