import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiModule } from '../ai/ai.module'
import { VocabularyWord } from './vocabulary-word.entity'
import { VocabularyProgress } from './vocabulary-progress.entity'
import { VocabularyService } from './vocabulary.service'
import { VocabularyController } from './vocabulary.controller'

@Module({
  imports: [TypeOrmModule.forFeature([VocabularyWord, VocabularyProgress]), AiModule],
  providers: [VocabularyService],
  controllers: [VocabularyController],
})
export class VocabularyModule {}
