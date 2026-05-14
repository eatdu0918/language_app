import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExamQuestion } from './exam-question.entity'
import { ExamSession } from './exam-session.entity'
import { User } from '../users/user.entity'
import { VocabularyWord } from '../vocabulary/vocabulary-word.entity'
import { VocabularyProgress } from '../vocabulary/vocabulary-progress.entity'
import { AiModule } from '../ai/ai.module'
import { RedisModule } from '../redis/redis.module'
import { ExamService } from './exam.service'
import { ExamController } from './exam.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamQuestion, ExamSession, User, VocabularyWord, VocabularyProgress]),
    AiModule,
    RedisModule,
  ],
  providers: [ExamService],
  controllers: [ExamController],
  exports: [ExamService],
})
export class ExamModule {}
