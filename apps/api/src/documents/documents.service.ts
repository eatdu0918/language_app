import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { Document } from './document.entity'
import type { SupportedLanguage, ProficiencyLevel, PaginatedResponse } from '@language-app/shared'

export interface CreateDocumentInput {
  title: string
  content: string
  language: SupportedLanguage
  level?: ProficiencyLevel
  tags?: string[]
  estimatedReadingMinutes?: number
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly repo: Repository<Document>,
    private readonly aiService: AiService,
  ) {}

  async findAll(
    language: SupportedLanguage,
    level?: ProficiencyLevel,
    page = 1,
    limit = 12,
  ): Promise<PaginatedResponse<Document>> {
    const [data, total] = await this.repo.findAndCount({
      where: { language, ...(level ? { level } : {}) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { data, total, page, limit }
  }

  findOne(id: string) {
    return this.repo.findOneByOrFail({ id })
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    const wordCount = input.content.trim().split(/\s+/).length
    const doc = this.repo.create({
      title: input.title,
      content: input.content,
      language: input.language,
      level: input.level ?? 'beginner',
      tags: input.tags ?? [],
      estimatedReadingMinutes: input.estimatedReadingMinutes ?? Math.max(1, Math.ceil(wordCount / 200)),
    })
    return this.repo.save(doc)
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id)
  }

  async adaptLevel(id: string, targetLevel: ProficiencyLevel) {
    const doc = await this.repo.findOneByOrFail({ id })
    return this.aiService.adjustDocumentLevel(doc.content, targetLevel, doc.language)
  }
}
