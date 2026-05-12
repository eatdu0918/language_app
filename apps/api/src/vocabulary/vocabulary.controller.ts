import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsNumber, Min, Max } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { VocabularyService } from './vocabulary.service'
import type { SupportedLanguage } from '@language-app/shared'

class ReviewDto {
  @IsNumber() @Min(0) @Max(5) quality!: number
}

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

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
