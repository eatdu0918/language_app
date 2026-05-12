import { Controller, Post, UploadedFile, UseGuards, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SpeechService } from './speech.service'
import type { SupportedLanguage } from '@language-app/shared'

@ApiTags('speech')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Post('transcribe')
  @ApiConsumes('multipart/form-data')
  async transcribe(
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Query('language') language?: SupportedLanguage,
  ) {
    return this.speechService.transcribe(file.buffer, file.mimetype, language)
  }
}
