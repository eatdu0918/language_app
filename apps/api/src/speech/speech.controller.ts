import { Controller, Post, UploadedFile, UseGuards, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger'
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
  @ApiOperation({
    summary: '음성 → 텍스트 변환 (Whisper)',
    description: 'multipart/form-data로 오디오 파일 전송. 내부적으로 faster-whisper 마이크로서비스 호출',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'audio/webm 또는 audio/* 파일' },
      },
    },
  })
  @ApiQuery({ name: 'language', enum: ['en', 'ja'], required: false, description: '미지정 시 자동 감지' })
  @ApiResponse({ status: 201, description: '{ text, language, duration }' })
  @ApiResponse({ status: 503, description: 'Whisper 서비스 연결 실패' })
  async transcribe(
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Query('language') language?: SupportedLanguage,
  ) {
    return this.speechService.transcribe(file.buffer, file.mimetype, language)
  }
}
