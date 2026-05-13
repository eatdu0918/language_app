import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VocabularyWord } from '../vocabulary/vocabulary-word.entity'
import { Document } from '../documents/document.entity'
import { SeedService } from './seed.service'

@Module({
  imports: [TypeOrmModule.forFeature([VocabularyWord, Document])],
  providers: [SeedService],
})
export class SeedModule {}
