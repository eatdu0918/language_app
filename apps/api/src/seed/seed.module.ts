import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VocabularyWord } from '../vocabulary/vocabulary-word.entity'
import { Document } from '../documents/document.entity'
import { ExamQuestion } from '../exam/exam-question.entity'
import { SeedService } from './seed.service'

@Module({
  imports: [TypeOrmModule.forFeature([VocabularyWord, Document, ExamQuestion])],
  providers: [SeedService],
})
export class SeedModule {}
