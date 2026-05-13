import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual, Between, MoreThan } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { RedisService } from '../redis/redis.service'
import { VocabularyWord } from './vocabulary-word.entity'
import { VocabularyProgress } from './vocabulary-progress.entity'
import { User } from '../users/user.entity'
import type { SupportedLanguage, ProficiencyLevel, PaginatedResponse } from '@language-app/shared'

export interface CreateWordInput {
  word: string
  reading?: string
  meaning: string
  exampleSentence: string
  exampleTranslation: string
  language: SupportedLanguage
  level?: ProficiencyLevel
  tags?: string[]
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

  async getWordBank(
    language: SupportedLanguage,
    level?: ProficiencyLevel,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<VocabularyWord>> {
    const [data, total] = await this.wordRepo.findAndCount({
      where: { language, ...(level ? { level } : {}) },
      order: { level: 'ASC', word: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { data, total, page, limit }
  }

  async addWord(input: CreateWordInput): Promise<VocabularyWord> {
    const word = this.wordRepo.create({
      ...input,
      level: input.level ?? 'beginner',
      tags: input.tags ?? [],
    })
    return this.wordRepo.save(word)
  }

  async enrollWord(userId: string, wordId: string): Promise<VocabularyProgress> {
    const existing = await this.progressRepo.findOne({
      where: { user: { id: userId }, word: { id: wordId } },
      relations: ['word'],
    })
    if (existing) return existing

    const word = await this.wordRepo.findOneByOrFail({ id: wordId })
    const dueDate = new Date()

    const progress = this.progressRepo.create({
      user: { id: userId } as any,
      word,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate,
      lastReviewedAt: null,
    })
    await this.redis.delPattern(`vocabulary:due:${userId}:*`)
    return this.progressRepo.save(progress)
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

  async generateExamples(wordId: string) {
    const word = await this.wordRepo.findOneByOrFail({ id: wordId })
    return this.aiService.generateVocabularyExample(word.word, word.language)
  }

  async initializeProgress(userId: string) {
    const words = await this.wordRepo.find()
    const existing = await this.progressRepo.find({
      where: { user: { id: userId } },
      select: { word: { id: true } },
      relations: ['word'],
    })
    const existingIds = new Set(existing.map((p) => p.word.id))

    const newProgress = words
      .filter((w) => !existingIds.has(w.id))
      .map((w) =>
        this.progressRepo.create({
          user: { id: userId } as User,
          word: w,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: new Date(),
          lastReviewedAt: null,
        }),
      )

    if (newProgress.length > 0) {
      await this.progressRepo.save(newProgress)
    }
  }

  async getStats(userId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [dueToday, reviewedToday, totalLearned] = await Promise.all([
      this.progressRepo.count({
        where: { user: { id: userId }, dueDate: LessThanOrEqual(new Date()) },
      }),
      this.progressRepo.count({
        where: {
          user: { id: userId },
          lastReviewedAt: Between(todayStart, todayEnd),
        },
      }),
      this.progressRepo.count({
        where: { user: { id: userId }, repetitions: MoreThan(0) },
      }),
    ])

    return { dueToday, reviewedToday, totalLearned }
  }
}
