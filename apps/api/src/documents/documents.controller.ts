import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { DocumentsService } from './documents.service'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @Query('language') language: SupportedLanguage = 'en',
    @Query('level') level?: ProficiencyLevel,
  ) {
    return this.documentsService.findAll(language, level)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id)
  }

  @Post(':id/adapt')
  adapt(@Param('id') id: string, @Query('level') level: ProficiencyLevel) {
    return this.documentsService.adaptLevel(id, level)
  }
}
