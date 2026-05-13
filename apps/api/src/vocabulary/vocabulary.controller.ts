import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, HttpCode } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min, Max, MinLength } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { VocabularyService } from './vocabulary.service'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

class ReviewDto {
  @ApiProperty({ minimum: 0, maximum: 5, description: 'SM-2 품질 점수 (0=완전망각, 5=완벽)' })
  @IsNumber() @Min(0) @Max(5) quality!: number
}

class CreateWordDto {
  @ApiProperty({ example: 'persevere' })
  @IsString() @MinLength(1) word!: string

  @ApiProperty({ example: 'にんたい', required: false })
  @IsOptional() @IsString() reading?: string

  @ApiProperty({ example: '인내하다' })
  @IsString() @MinLength(1) meaning!: string

  @ApiProperty({ example: 'You must persevere through difficulties.' })
  @IsString() exampleSentence!: string

  @ApiProperty({ example: '어려움을 이겨내야 한다.' })
  @IsString() exampleTranslation!: string

  @ApiProperty({ enum: ['en', 'ja'] })
  @IsString() language!: SupportedLanguage

  @ApiProperty({ enum: ['beginner', 'elementary', 'intermediate', 'advanced'], required: false })
  @IsOptional() @IsString() level?: ProficiencyLevel

  @ApiProperty({ type: [String], required: false, example: ['verb', 'academic'] })
  @IsOptional() tags?: string[]
}

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('stats')
  getStats(@Request() req: { user: { sub: string } }) {
    return this.vocabularyService.getStats(req.user.sub)
  }

  @Get('words')
  @ApiOperation({ summary: '단어 뱅크 조회', description: '전체 단어 목록 (페이지네이션)' })
  @ApiQuery({ name: 'language', enum: ['en', 'ja'], required: false })
  @ApiQuery({ name: 'level', enum: ['beginner', 'elementary', 'intermediate', 'advanced'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'PaginatedResponse<VocabularyWord>' })
  getWordBank(
    @Query('language') language: SupportedLanguage = 'en',
    @Query('level') level?: ProficiencyLevel,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vocabularyService.getWordBank(language, level, page ? Number(page) : 1, limit ? Math.min(Number(limit), 50) : 20)
  }

  @Post('words')
  @ApiOperation({ summary: '단어 추가 (관리자/시드용)' })
  @ApiBody({ type: CreateWordDto })
  @ApiResponse({ status: 201, description: '생성된 단어' })
  addWord(@Body() dto: CreateWordDto) {
    return this.vocabularyService.addWord(dto)
  }

  @Post('words/:wordId/enroll')
  @HttpCode(200)
  @ApiOperation({ summary: '내 학습 목록에 단어 등록', description: '이미 등록된 단어면 기존 진행 레코드 반환' })
  @ApiParam({ name: 'wordId', description: '단어 UUID' })
  @ApiResponse({ status: 200, description: 'VocabularyProgress' })
  @ApiResponse({ status: 404, description: '단어를 찾을 수 없음' })
  enroll(
    @Request() req: { user: { sub: string } },
    @Param('wordId') wordId: string,
  ) {
    return this.vocabularyService.enrollWord(req.user.sub, wordId)
  }

  @Get('due')
  @ApiOperation({ summary: '오늘 복습할 단어 목록', description: 'dueDate ≤ 오늘인 VocabularyProgress 목록' })
  @ApiQuery({ name: 'language', enum: ['en', 'ja'], required: false })
  @ApiResponse({ status: 200, description: 'VocabularyProgress[]' })
  getDue(
    @Request() req: { user: { sub: string } },
    @Query('language') language: SupportedLanguage = 'en',
  ) {
    return this.vocabularyService.getDueWords(req.user.sub, language)
  }

  @Post(':wordId/review')
  @ApiOperation({ summary: 'SM-2 복습 결과 제출' })
  @ApiParam({ name: 'wordId', description: '단어 UUID' })
  @ApiBody({ type: ReviewDto })
  @ApiResponse({ status: 201, description: '업데이트된 VocabularyProgress' })
  @ApiResponse({ status: 404, description: '진행 레코드 없음 (enroll 먼저 필요)' })
  review(
    @Request() req: { user: { sub: string } },
    @Param('wordId') wordId: string,
    @Body() dto: ReviewDto,
  ) {
    return this.vocabularyService.reviewWord(req.user.sub, wordId, dto.quality)
  }

  @Get(':wordId/examples')
  @ApiOperation({ summary: 'AI 예문 생성', description: 'Ollama로 단어 예문 3개 생성' })
  @ApiParam({ name: 'wordId', description: '단어 UUID' })
  @ApiResponse({ status: 200, description: '생성된 예문' })
  examples(@Param('wordId') wordId: string) {
    return this.vocabularyService.generateExamples(wordId)
  }
}
