import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { VocabularyWord } from './vocabulary-word.entity'
import { VocabularyProgress } from './vocabulary-progress.entity'
import type { SupportedLanguage } from '@language-app/shared'

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(VocabularyWord) private readonly wordRepo: Repository<VocabularyWord>,
    @InjectRepository(VocabularyProgress) private readonly progressRepo: Repository<VocabularyProgress>,
    private readonly aiService: AiService,
  ) {}

  async getDueWords(userId: string, language: SupportedLanguage, limit = 20) {
    return this.progressRepo.find({
      where: {
        user: { id: userId },
        word: { language },
        dueDate: LessThanOrEqual(new Date()),
      },
      relations: ['word'],
      take: limit,
      order: { dueDate: 'ASC' },
    })
  }

  async reviewWord(userId: string, wordId: string, quality: number) {
    const progress = await this.progressRepo.findOne({
      where: { user: { id: userId }, word: { id: wordId } },
    })

    if (!progress) return null

    // SM-2 Algorithm
    const ef = Math.max(1.3, progress.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    const repetitions = quality >= 3 ? progress.repetitions + 1 : 0
    const interval = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(progress.interval * ef)

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + interval)

    return this.progressRepo.save({
      ...progress,
      easeFactor: ef,
      repetitions,
      interval,
      dueDate,
      lastReviewedAt: new Date(),
    })
  }

  async generateExamples(wordId: string) {
    const word = await this.wordRepo.findOneByOrFail({ id: wordId })
    return this.aiService.generateVocabularyExample(word.word, word.language)
  }
}
