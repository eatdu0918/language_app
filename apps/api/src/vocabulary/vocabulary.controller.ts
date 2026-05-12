import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, HttpCode } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min, Max, MinLength } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { VocabularyService } from './vocabulary.service'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

class ReviewDto {
  @IsNumber() @Min(0) @Max(5) quality!: number
}

class CreateWordDto {
  @IsString() @MinLength(1) word!: string
  @IsOptional() @IsString() reading?: string
  @IsString() @MinLength(1) meaning!: string
  @IsString() exampleSentence!: string
  @IsString() exampleTranslation!: string
  @IsString() language!: SupportedLanguage
  @IsOptional() @IsString() level?: ProficiencyLevel
  @IsOptional() tags?: string[]
}

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('words')
  getWordBank(
    @Query('language') language: SupportedLanguage = 'en',
    @Query('level') level?: ProficiencyLevel,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vocabularyService.getWordBank(language, level, page ? Number(page) : 1, limit ? Math.min(Number(limit), 50) : 20)
  }

  @Post('words')
  addWord(@Body() dto: CreateWordDto) {
    return this.vocabularyService.addWord(dto)
  }

  @Post('words/:wordId/enroll')
  @HttpCode(200)
  enroll(
    @Request() req: { user: { sub: string } },
    @Param('wordId') wordId: string,
  ) {
    return this.vocabularyService.enrollWord(req.user.sub, wordId)
  }

  @Get('due')
  getDue(
    @Request() req: { user: { sub: string } },
    @Query('language') language: SupportedLanguage = 'en',
  ) {
    return this.vocabularyService.getDueWords(req.user.sub, language)
  }

  @Post(':wordId/review')
  review(
    @Request() req: { user: { sub: string } },
    @Param('wordId') wordId: string,
    @Body() dto: ReviewDto,
  ) {
    return this.vocabularyService.reviewWord(req.user.sub, wordId, dto.quality)
  }

  @Get(':wordId/examples')
  examples(@Param('wordId') wordId: string) {
    return this.vocabularyService.generateExamples(wordId)
  }
}
