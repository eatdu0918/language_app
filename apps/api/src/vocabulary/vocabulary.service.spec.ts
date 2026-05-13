import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException } from '@nestjs/common'
import { VocabularyService } from './vocabulary.service'
import { VocabularyWord } from './vocabulary-word.entity'
import { VocabularyProgress } from './vocabulary-progress.entity'
import { AiService } from '../ai/ai.service'

const mockWord = {
  id: 'word-uuid',
  word: 'persevere',
  meaning: '인내하다',
  language: 'en',
  level: 'intermediate',
  tags: ['verb'],
  exampleSentence: 'You must persevere.',
  exampleTranslation: '인내해야 한다.',
} as VocabularyWord

const mockProgress = {
  id: 'progress-uuid',
  user: { id: 'user-uuid' },
  word: mockWord,
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  dueDate: new Date('2000-01-01'),
  lastReviewedAt: null,
} as any

const mockWordRepo = {
  findAndCount: jest.fn(),
  findOneByOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
}

const mockProgressRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
}

const mockAiService = {
  generateVocabularyExample: jest.fn(),
}

describe('VocabularyService', () => {
  let service: VocabularyService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        { provide: getRepositoryToken(VocabularyWord), useValue: mockWordRepo },
        { provide: getRepositoryToken(VocabularyProgress), useValue: mockProgressRepo },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile()

    service = module.get<VocabularyService>(VocabularyService)
  })

  describe('getWordBank', () => {
    it('언어별 단어 목록을 페이지네이션과 함께 반환한다', async () => {
      mockWordRepo.findAndCount.mockResolvedValue([[mockWord], 1])

      const result = await service.getWordBank('en', undefined, 1, 20)

      expect(mockWordRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { language: 'en' }, skip: 0, take: 20 }),
      )
      expect(result).toEqual({ data: [mockWord], total: 1, page: 1, limit: 20 })
    })

    it('레벨 필터를 적용한다', async () => {
      mockWordRepo.findAndCount.mockResolvedValue([[], 0])

      await service.getWordBank('en', 'intermediate', 1, 20)

      expect(mockWordRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { language: 'en', level: 'intermediate' } }),
      )
    })
  })

  describe('enrollWord', () => {
    it('이미 등록된 단어는 기존 progress를 반환한다', async () => {
      mockProgressRepo.findOne.mockResolvedValue(mockProgress)

      const result = await service.enrollWord('user-uuid', 'word-uuid')

      expect(mockProgressRepo.create).not.toHaveBeenCalled()
      expect(result).toBe(mockProgress)
    })

    it('미등록 단어는 새 progress를 생성한다', async () => {
      mockProgressRepo.findOne.mockResolvedValue(null)
      mockWordRepo.findOneByOrFail.mockResolvedValue(mockWord)
      mockProgressRepo.create.mockReturnValue(mockProgress)
      mockProgressRepo.save.mockResolvedValue(mockProgress)

      const result = await service.enrollWord('user-uuid', 'word-uuid')

      expect(mockProgressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 1, easeFactor: 2.5, repetitions: 0 }),
      )
      expect(result).toBe(mockProgress)
    })
  })

  describe('reviewWord', () => {
    it('quality >= 3이면 repetitions를 증가시킨다', async () => {
      mockProgressRepo.findOne.mockResolvedValue({ ...mockProgress, repetitions: 0, interval: 1 })
      mockProgressRepo.save.mockImplementation((p: any) => Promise.resolve(p))

      await service.reviewWord('user-uuid', 'word-uuid', 4)

      const saved = mockProgressRepo.save.mock.calls[0][0]
      expect(saved.repetitions).toBe(1)
    })

    it('quality < 3이면 repetitions를 0으로 초기화한다', async () => {
      mockProgressRepo.findOne.mockResolvedValue({ ...mockProgress, repetitions: 5, interval: 10 })
      mockProgressRepo.save.mockImplementation((p: any) => Promise.resolve(p))

      await service.reviewWord('user-uuid', 'word-uuid', 2)

      const saved = mockProgressRepo.save.mock.calls[0][0]
      expect(saved.repetitions).toBe(0)
      expect(saved.interval).toBe(1)
    })

    it('진행 레코드가 없으면 null을 반환한다', async () => {
      mockProgressRepo.findOne.mockResolvedValue(null)

      const result = await service.reviewWord('user-uuid', 'word-uuid', 5)

      expect(result).toBeNull()
    })
  })

  describe('getDueWords', () => {
    it('만기된 단어 목록을 반환한다', async () => {
      mockProgressRepo.find.mockResolvedValue([mockProgress])

      const result = await service.getDueWords('user-uuid', 'en')

      expect(mockProgressRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['word'] }),
      )
      expect(result).toEqual([mockProgress])
    })
  })
})
