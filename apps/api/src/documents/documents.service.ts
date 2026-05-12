import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AiService } from '../ai/ai.service'
import { Document } from './document.entity'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly repo: Repository<Document>,
    private readonly aiService: AiService,
  ) {}

  findAll(language: SupportedLanguage, level?: ProficiencyLevel) {
    return this.repo.find({
      where: { language, ...(level ? { level } : {}) },
      order: { createdAt: 'DESC' },
    })
  }

  findOne(id: string) {
    return this.repo.findOneByOrFail({ id })
  }

  async adaptLevel(id: string, targetLevel: ProficiencyLevel) {
    const doc = await this.repo.findOneByOrFail({ id })
    return this.aiService.adjustDocumentLevel(doc.content, targetLevel, doc.language)
  }
}
