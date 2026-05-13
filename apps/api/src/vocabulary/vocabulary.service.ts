import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { RedisService } from '../redis/redis.service'
import { VocabularyWord } from './vocabulary-word.entity'
import { VocabularyProgress } from './vocabulary-progress.entity'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

export interface CreateWordDto {
  word: string
  reading?: string
  meaning: string
  exampleSentence: string
  exampleTranslation: string
  language: SupportedLanguage
  level: ProficiencyLevel
  tags: string[]
}

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(VocabularyWord) private readonly wordRepo: Repository<VocabularyWord>,
    @InjectRepository(VocabularyProgress) private readonly progressRepo: Repository<VocabularyProgress>,
    private readonly aiService: AiService,
    private readonly redis: RedisService,
  ) {}

  private dueKey(userId: string, language: SupportedLanguage) {
    return `vocabulary:due:${userId}:${language}`
  }

  async getDueWords(userId: string, language: SupportedLanguage, limit = 20) {
    const cacheKey = this.dueKey(userId, language)
    const cached = await this.redis.get<VocabularyProgress[]>(cacheKey)
    if (cached) return cached

    const result = await this.progressRepo.find({
      where: {
        user: { id: userId },
        word: { language },
        dueDate: LessThanOrEqual(new Date()),
      },
      relations: ['word'],
      take: limit,
      order: { dueDate: 'ASC' },
    })

    await this.redis.set(cacheKey, result, 60)
    return result
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

    const updated = await this.progressRepo.save({
      ...progress,
      easeFactor: ef,
      repetitions,
      interval,
      dueDate,
      lastReviewedAt: new Date(),
    })

    await this.redis.delPattern(`vocabulary:due:${userId}:*`)
    return updated
  }

  async addWord(userId: string, dto: CreateWordDto) {
    const word = await this.wordRepo.save({
      word: dto.word,
      reading: dto.reading ?? null,
      meaning: dto.meaning,
      exampleSentence: dto.exampleSentence,
      exampleTranslation: dto.exampleTranslation,
      language: dto.language,
      level: dto.level,
      tags: dto.tags,
    })
    await this.progressRepo.save({
      user: { id: userId },
      word: { id: word.id },
      easeFactor: 2.5,
      repetitions: 0,
      interval: 1,
      dueDate: new Date(),
    })
    await this.redis.delPattern(`vocabulary:due:${userId}:*`)
    return word
  }

  async generateExamples(wordId: string) {
    const word = await this.wordRepo.findOneByOrFail({ id: wordId })
    return this.aiService.generateVocabularyExample(word.word, word.language)
  }
}
