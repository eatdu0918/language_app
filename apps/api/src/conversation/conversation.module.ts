import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiModule } from '../ai/ai.module'
import { SpeechModule } from '../speech/speech.module'
import { ConversationSession } from './conversation-session.entity'
import { ConversationMessage } from './conversation-message.entity'
import { ConversationService } from './conversation.service'
import { ConversationController } from './conversation.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ConversationSession, ConversationMessage]), AiModule, SpeechModule],
  providers: [ConversationService],
  controllers: [ConversationController],
})
export class ConversationModule {}
