import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsObject, IsString } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PlacementService } from './placement.service'
import type { SupportedLanguage } from '@language-app/shared'

class SubmitDto {
  @IsString() language!: SupportedLanguage
  @IsObject() answers!: Record<string, string>
}

@ApiTags('placement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('placement')
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Get('questions')
  getQuestions(@Query('language') language: SupportedLanguage = 'en') {
    return this.placementService.getQuestions(language)
  }

  @Post('submit')
  submit(
    @Request() req: { user: { sub: string } },
    @Body() dto: SubmitDto,
  ) {
    return this.placementService.submit(req.user.sub, dto.language, dto.answers)
  }
}
