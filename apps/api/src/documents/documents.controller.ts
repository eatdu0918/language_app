import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNumber, IsOptional, IsString, MinLength, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { DocumentsService } from './documents.service'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

class CreateDocumentDto {
  @ApiProperty({ example: 'The History of Jazz' })
  @IsString() @MinLength(1) title!: string

  @ApiProperty({ example: 'Jazz is a music genre...' })
  @IsString() @MinLength(1) content!: string

  @ApiProperty({ enum: ['en', 'ja'] })
  @IsString() language!: SupportedLanguage

  @ApiProperty({ enum: ['beginner', 'elementary', 'intermediate', 'advanced'], required: false })
  @IsOptional() @IsString() level?: ProficiencyLevel

  @ApiProperty({ type: [String], required: false, example: ['music', 'culture'] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]

  @ApiProperty({ type: Number, required: false, description: '미입력 시 단어 수 기반 자동 계산' })
  @IsOptional() @IsNumber() @Type(() => Number) estimatedReadingMinutes?: number
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: '문서 목록 조회 (페이지네이션)' })
  @ApiQuery({ name: 'language', enum: ['en', 'ja'], required: false })
  @ApiQuery({ name: 'level', enum: ['beginner', 'elementary', 'intermediate', 'advanced'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 12 })
  @ApiResponse({ status: 200, description: 'PaginatedResponse<Document>' })
  findAll(
    @Query('language') language: SupportedLanguage = 'en',
    @Query('level') level?: ProficiencyLevel,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.findAll(language, level, page ? Number(page) : 1, limit ? Math.min(Number(limit), 50) : 12)
  }

  @Post()
  @ApiOperation({ summary: '문서 생성' })
  @ApiBody({ type: CreateDocumentDto })
  @ApiResponse({ status: 201, description: '생성된 문서' })
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '문서 단건 조회' })
  @ApiParam({ name: 'id', description: '문서 UUID' })
  @ApiResponse({ status: 200, description: '문서 상세' })
  @ApiResponse({ status: 404, description: '문서를 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '문서 삭제' })
  @ApiParam({ name: 'id', description: '문서 UUID' })
  @ApiResponse({ status: 204, description: '삭제 완료' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id)
  }

  @Post(':id/adapt')
  @ApiOperation({ summary: 'AI 레벨 조정', description: '문서 내용을 지정 레벨에 맞게 AI가 재작성' })
  @ApiParam({ name: 'id', description: '문서 UUID' })
  @ApiQuery({ name: 'level', enum: ['beginner', 'elementary', 'intermediate', 'advanced'] })
  @ApiResponse({ status: 201, description: '레벨 조정된 텍스트' })
  adapt(@Param('id') id: string, @Query('level') level: ProficiencyLevel) {
    return this.documentsService.adaptLevel(id, level)
  }
}
