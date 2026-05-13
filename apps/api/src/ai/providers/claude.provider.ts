import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import type { AIMessage, AIOptions, AIProvider } from '@language-app/shared'

@Injectable()
export class ClaudeProvider implements AIProvider {
  private readonly client: Anthropic
  private readonly defaultModel: string
  private readonly logger = new Logger(ClaudeProvider.name)

  constructor(config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY', '') })
    this.defaultModel = config.get('CLAUDE_MODEL', 'claude-sonnet-4-6')
  }

  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system')
    const userMessages = messages.filter((m) => m.role !== 'system')

    const response = await this.client.messages.create({
      model: options?.model ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 2048,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })

    const block = response.content[0]
    return block?.type === 'text' ? block.text : ''
  }

  async *stream(messages: AIMessage[], options?: AIOptions): AsyncIterable<string> {
    const systemMsg = messages.find((m) => m.role === 'system')
    const userMessages = messages.filter((m) => m.role !== 'system')

    const stream = this.client.messages.stream({
      model: options?.model ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 2048,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}
