import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ExamQuestion } from './exam-question.entity'
import { ExamSession } from './exam-session.entity'
import { User } from '../users/user.entity'
import { VocabularyWord } from '../vocabulary/vocabulary-word.entity'
import { VocabularyProgress } from '../vocabulary/vocabulary-progress.entity'
import { AiService } from '../ai/ai.service'
import { RedisService } from '../redis/redis.service'
import type { ExamType, ExamLevel, ExamStats, ExamLevelStats } from '@language-app/shared'

const TOEIC_LEVELS: ExamLevel[] = ['toeic-200', 'toeic-400', 'toeic-600', 'toeic-800', 'toeic-900']
const JLPT_LEVELS: ExamLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export interface WeakPointAnalysis {
  vocabulary: { correct: number; total: number; accuracy: number }
  grammar: { correct: number; total: number; accuracy: number }
  reading: { correct: number; total: number; accuracy: number }
  toeicByLevel: { level: ExamLevel; accuracy: number; attempts: number }[]
  jlptByLevel: { level: ExamLevel; accuracy: number; attempts: number }[]
  enrolledCount: number  // 마지막 제출 시 자동 등록된 단어 수 (임시)
}

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name)

  constructor(
    @InjectRepository(ExamQuestion) private readonly questionRepo: Repository<ExamQuestion>,
    @InjectRepository(ExamSession) private readonly sessionRepo: Repository<ExamSession>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(VocabularyWord) private readonly wordRepo: Repository<VocabularyWord>,
    @InjectRepository(VocabularyProgress) private readonly progressRepo: Repository<VocabularyProgress>,
    private readonly aiService: AiService,
    private readonly redis: RedisService,
  ) {}

  async getQuestions(examType: ExamType, level: ExamLevel, limit = 10): Promise<ExamQuestion[]> {
    const questions = await this.questionRepo.find({ where: { examType, level } })
    return questions.sort(() => Math.random() - 0.5).slice(0, limit)
  }

  async startSession(userId: string, examType: ExamType, level: ExamLevel): Promise<{ sessionId: string; questions: ExamQuestion[] }> {
    const questions = await this.getQuestions(examType, level, 10)
    if (questions.length === 0) throw new NotFoundException('해당 레벨의 문제가 없습니다')

    const user = await this.userRepo.findOneByOrFail({ id: userId })
    const session = this.sessionRepo.create({
      user,
      examType,
      level,
      totalQuestions: questions.length,
      answers: [],
      completedAt: null,
    })
    const saved = await this.sessionRepo.save(session)
    return { sessionId: saved.id, questions }
  }

  async submitSession(
    userId: string,
    sessionId: string,
    submitted: { questionId: string; selected: number }[],
  ): Promise<ExamSession & { autoEnrolledCount: number }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    })
    if (!session || session.user.id !== userId) throw new NotFoundException('세션을 찾을 수 없습니다')
    if (session.completedAt) return { ...session, autoEnrolledCount: 0 }

    const questionIds = submitted.map((a) => a.questionId)
    const questions = await this.questionRepo.find({ where: { id: In(questionIds) } })
    const qMap = new Map(questions.map((q) => [q.id, q]))

    let score = 0
    const answers = submitted.map((a) => {
      const q = qMap.get(a.questionId)
      const correct = q ? q.answer === a.selected : false
      if (correct) score++
      return { questionId: a.questionId, selected: a.selected, correct }
    })

    session.answers = answers
    session.score = score
    session.completedAt = new Date()
    await this.sessionRepo.save(session)

    // 오답 vocabulary 문제 → 단어 자동 등록
    const autoEnrolledCount = await this.autoEnrollWrongVocab(userId, session.examType, answers, qMap)

    return { ...session, autoEnrolledCount }
  }

  // 오답 vocabulary 문제에서 단어를 찾아 자동으로 SRS 등록
  private async autoEnrollWrongVocab(
    userId: string,
    examType: ExamType,
    answers: { questionId: string; selected: number; correct: boolean }[],
    qMap: Map<string, ExamQuestion>,
  ): Promise<number> {
    const wrongVocabQuestions = answers
      .filter((a) => !a.correct)
      .map((a) => qMap.get(a.questionId))
      .filter((q): q is ExamQuestion => !!q && q.category === 'vocabulary')

    if (wrongVocabQuestions.length === 0) return 0

    // 시험 타입에 따른 언어
    const language = examType === 'toeic' ? 'en' : 'ja'

    // 오답 문제의 레벨 태그로 해당 단어 검색 (각 문제의 레벨에 해당하는 단어들)
    const levels = [...new Set(wrongVocabQuestions.map((q) => q.level))]
    const tagPatterns = levels.map((lv) =>
      examType === 'toeic' ? `TOEIC-${lv.replace('toeic-', '')}` : `JLPT-${lv}`,
    )

    // 해당 레벨의 단어 중 아직 등록 안 된 것 최대 5개
    const allWords = await this.wordRepo.find({ where: { language }, take: 200 })
    const matchingWords = allWords.filter((w) =>
      tagPatterns.some((tag) => w.tags.includes(tag)),
    )

    if (matchingWords.length === 0) return 0

    // 이미 등록된 단어 id 조회
    const existingProgress = await this.progressRepo.find({
      where: { user: { id: userId } },
      relations: ['word'],
      select: ['id', 'word'],
    })
    const enrolledWordIds = new Set(existingProgress.map((p) => p.word.id))

    const toEnroll = matchingWords
      .filter((w) => !enrolledWordIds.has(w.id))
      .slice(0, Math.min(wrongVocabQuestions.length * 2, 5))

    if (toEnroll.length === 0) return 0

    const progresses = toEnroll.map((word) =>
      this.progressRepo.create({
        user: { id: userId } as User,
        word,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: new Date(),
        lastReviewedAt: null,
      }),
    )
    await this.progressRepo.save(progresses)

    // 캐시 무효화
    await this.redis.delPattern(`vocabulary:due:${userId}:*`)

    this.logger.log(`Auto-enrolled ${progresses.length} words for user ${userId}`)
    return progresses.length
  }

  async getHistory(userId: string, examType?: ExamType) {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.completedAt IS NOT NULL')
      .orderBy('s.startedAt', 'DESC')
      .limit(50)

    if (examType) qb.andWhere('s.examType = :examType', { examType })
    return qb.getMany()
  }

  async getStats(userId: string): Promise<ExamStats> {
    const sessions = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.completedAt IS NOT NULL')
      .getMany()

    const buildStats = (levels: ExamLevel[]): ExamLevelStats[] =>
      levels.map((level) => {
        const levelSessions = sessions.filter((s) => s.level === level)
        if (levelSessions.length === 0) {
          return { level, bestScore: 0, attempts: 0, lastAttemptAt: null, passed: false }
        }
        const bestScore = Math.max(...levelSessions.map((s) => Math.round((s.score / s.totalQuestions) * 100)))
        const latest = levelSessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
        const lastAttemptAt = latest ? latest.startedAt.toISOString() : null
        return { level, bestScore, attempts: levelSessions.length, lastAttemptAt, passed: bestScore >= 70 }
      })

    return {
      toeic: buildStats(TOEIC_LEVELS),
      jlpt: buildStats(JLPT_LEVELS),
    }
  }

  async getAnalysis(userId: string): Promise<WeakPointAnalysis> {
    const sessions = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.completedAt IS NOT NULL')
      .getMany()

    if (sessions.length === 0) {
      const empty = { correct: 0, total: 0, accuracy: 0 }
      return {
        vocabulary: empty,
        grammar: empty,
        reading: empty,
        toeicByLevel: TOEIC_LEVELS.map((level) => ({ level, accuracy: 0, attempts: 0 })),
        jlptByLevel: JLPT_LEVELS.map((level) => ({ level, accuracy: 0, attempts: 0 })),
        enrolledCount: 0,
      }
    }

    // 모든 세션의 답 수집
    const allAnswers = sessions.flatMap((s) => s.answers)
    const allQuestionIds = allAnswers.map((a) => a.questionId)
    const uniqueIds = [...new Set(allQuestionIds)]
    const questions = uniqueIds.length > 0
      ? await this.questionRepo.find({ where: { id: In(uniqueIds) } })
      : []
    const qMap = new Map(questions.map((q) => [q.id, q]))

    // 카테고리별 집계
    const categoryStats: Record<string, { correct: number; total: number }> = {
      vocabulary: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
    }

    for (const ans of allAnswers) {
      const q = qMap.get(ans.questionId)
      if (!q) continue
      const cat = q.category
      if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 }
      categoryStats[cat].total++
      if (ans.correct) categoryStats[cat].correct++
    }

    const toStat = (cat: string) => {
      const s = categoryStats[cat] ?? { correct: 0, total: 0 }
      return { correct: s.correct, total: s.total, accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }
    }

    // 레벨별 집계
    const levelAccuracy = (levels: ExamLevel[]) =>
      levels.map((level) => {
        const ls = sessions.filter((s) => s.level === level)
        if (ls.length === 0) return { level, accuracy: 0, attempts: 0 }
        const totalScore = ls.reduce((sum, s) => sum + s.score, 0)
        const totalQ = ls.reduce((sum, s) => sum + s.totalQuestions, 0)
        return { level, accuracy: totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0, attempts: ls.length }
      })

    return {
      vocabulary: toStat('vocabulary'),
      grammar: toStat('grammar'),
      reading: toStat('reading'),
      toeicByLevel: levelAccuracy(TOEIC_LEVELS),
      jlptByLevel: levelAccuracy(JLPT_LEVELS),
      enrolledCount: 0,
    }
  }

  async generateQuestionsWithAI(examType: ExamType, level: ExamLevel, count = 5): Promise<ExamQuestion[]> {
    const cacheKey = `exam:gen:${examType}:${level}:${Date.now()}`
    this.logger.log(`Generating ${count} AI questions for ${examType} ${level}`)

    let rawJson: string
    try {
      rawJson = await this.aiService.generateExamQuestions(examType, level, count)
    } catch (e) {
      throw new BadRequestException('AI 문제 생성 실패')
    }

    // JSON 파싱 (마크다운 코드블록 제거)
    const cleaned = rawJson.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed: { category: string; question: string; options: string[]; answer: number; explanation: string }[]
    try {
      parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) throw new Error('Not an array')
    } catch {
      this.logger.error(`AI returned invalid JSON: ${rawJson.substring(0, 200)}`)
      throw new BadRequestException('AI가 올바른 형식의 문제를 생성하지 못했습니다')
    }

    // 유효성 검사 후 저장
    const toSave = parsed
      .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number')
      .slice(0, count)
      .map((q) =>
        this.questionRepo.create({
          examType,
          level,
          category: (['vocabulary', 'grammar', 'reading'].includes(q.category) ? q.category : 'vocabulary') as ExamQuestion['category'],
          question: q.question,
          options: q.options,
          answer: Math.min(3, Math.max(0, q.answer)),
          explanation: q.explanation ?? '',
        }),
      )

    if (toSave.length === 0) throw new BadRequestException('유효한 문제가 생성되지 않았습니다')

    const saved = await this.questionRepo.save(toSave)
    this.logger.log(`Saved ${saved.length} AI-generated questions`)
    return saved
  }

  async getSessionWithQuestions(userId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    })
    if (!session || session.user.id !== userId) throw new NotFoundException('세션을 찾을 수 없습니다')

    const questionIds = session.answers.map((a) => a.questionId)
    const questions = questionIds.length > 0
      ? await this.questionRepo.find({ where: { id: In(questionIds) } })
      : []
    return { session, questions }
  }
}
