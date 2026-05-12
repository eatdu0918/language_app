import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityNotFoundError } from 'typeorm'
import { DocumentsService } from './documents.service'
import { Document } from './document.entity'
import { AiService } from '../ai/ai.service'

const mockDoc = {
  id: 'doc-uuid',
  title: 'Test Article',
  content: 'This is a test article with some content.',
  language: 'en',
  level: 'beginner',
  estimatedReadingMinutes: 1,
  tags: ['test'],
  createdAt: new Date(),
} as Document

const mockRepo = {
  findAndCount: jest.fn(),
  findOneByOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}

const mockAiService = {
  adjustDocumentLevel: jest.fn(),
}

describe('DocumentsService', () => {
  let service: DocumentsService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useValue: mockRepo },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile()

    service = module.get<DocumentsService>(DocumentsService)
  })

  describe('findAll', () => {
    it('페이지네이션된 문서 목록을 반환한다', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockDoc], 1])

      const result = await service.findAll('en', undefined, 1, 12)

      expect(result).toEqual({ data: [mockDoc], total: 1, page: 1, limit: 12 })
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { language: 'en' }, skip: 0, take: 12 }),
      )
    })

    it('page 2 요청 시 올바른 offset을 계산한다', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 25])

      await service.findAll('en', undefined, 2, 12)

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 12, take: 12 }),
      )
    })

    it('레벨 필터를 적용한다', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0])

      await service.findAll('ja', 'intermediate', 1, 12)

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { language: 'ja', level: 'intermediate' } }),
      )
    })
  })

  describe('create', () => {
    it('단어 수로 읽기 시간을 자동 계산한다', async () => {
      // 200단어 = 1분 (외국어 학습 기준)
      const content = Array(200).fill('word').join(' ')
      mockRepo.create.mockReturnValue({ ...mockDoc, content })
      mockRepo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 'new-uuid' }))

      await service.create({ title: 'Test', content, language: 'en' })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ estimatedReadingMinutes: 1 }),
      )
    })

    it('estimatedReadingMinutes를 직접 지정하면 계산을 건너뛴다', async () => {
      mockRepo.create.mockReturnValue(mockDoc)
      mockRepo.save.mockResolvedValue(mockDoc)

      await service.create({
        title: 'Test', content: 'short', language: 'en', estimatedReadingMinutes: 5,
      })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ estimatedReadingMinutes: 5 }),
      )
    })

    it('level 미지정 시 beginner로 기본값 설정', async () => {
      mockRepo.create.mockReturnValue(mockDoc)
      mockRepo.save.mockResolvedValue(mockDoc)

      await service.create({ title: 'Test', content: 'content', language: 'en' })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'beginner' }),
      )
    })
  })

  describe('remove', () => {
    it('delete를 호출한다', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 })

      await service.remove('doc-uuid')

      expect(mockRepo.delete).toHaveBeenCalledWith('doc-uuid')
    })
  })

  describe('adaptLevel', () => {
    it('AI 서비스에 레벨 조정을 위임한다', async () => {
      mockRepo.findOneByOrFail.mockResolvedValue(mockDoc)
      mockAiService.adjustDocumentLevel.mockResolvedValue({ text: '...adjusted...' })

      await service.adaptLevel('doc-uuid', 'advanced')

      expect(mockAiService.adjustDocumentLevel).toHaveBeenCalledWith(
        mockDoc.content, 'advanced', mockDoc.language,
      )
    })
  })
})
