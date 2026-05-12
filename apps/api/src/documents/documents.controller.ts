import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsArray, IsNumber, IsOptional, IsString, MinLength, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { DocumentsService } from './documents.service'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

class CreateDocumentDto {
  @IsString() @MinLength(1) title!: string
  @IsString() @MinLength(1) content!: string
  @IsString() language!: SupportedLanguage
  @IsOptional() @IsString() level?: ProficiencyLevel
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
  @IsOptional() @IsNumber() @Type(() => Number) estimatedReadingMinutes?: number
}

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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.findAll(language, level, page ? Number(page) : 1, limit ? Math.min(Number(limit), 50) : 12)
  }

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id)
  }

  @Post(':id/adapt')
  adapt(@Param('id') id: string, @Query('level') level: ProficiencyLevel) {
    return this.documentsService.adaptLevel(id, level)
  }
}
