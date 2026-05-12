import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { ConversationSession } from './conversation-session.entity'
import { ConversationMessage } from './conversation-message.entity'
import type { SupportedLanguage } from '@language-app/shared'

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationSession) private readonly sessionRepo: Repository<ConversationSession>,
    @InjectRepository(ConversationMessage) private readonly messageRepo: Repository<ConversationMessage>,
    private readonly aiService: AiService,
  ) {}

  async createSession(userId: string, language: SupportedLanguage, scenario: string) {
    return this.sessionRepo.save({
      user: { id: userId },
      language,
      scenario,
    })
  }

  async getSession(sessionId: string) {
    return this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['messages'],
      order: { messages: { timestamp: 'ASC' } },
    })
  }

  async *sendMessage(
    sessionId: string,
    userText: string,
  ): AsyncIterable<string> {
    const session = await this.sessionRepo.findOneOrFail({
      where: { id: sessionId },
      relations: ['messages'],
    })

    await this.messageRepo.save({ session: { id: sessionId }, role: 'user', content: userText })

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: userText })

    let fullResponse = ''
    for await (const chunk of this.aiService.conversationStream(history, session.language, session.scenario)) {
      fullResponse += chunk
      yield chunk
    }

    await this.messageRepo.save({ session: { id: sessionId }, role: 'assistant', content: fullResponse })
  }

  async endSession(sessionId: string) {
    await this.sessionRepo.update(sessionId, { endedAt: new Date() })
    const session = await this.getSession(sessionId)
    if (!session) return null

    const transcript = session.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
    return this.aiService.analyzeConversation(transcript, session.language)
  }
}
