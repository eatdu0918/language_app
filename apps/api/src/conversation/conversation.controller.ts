import { Controller, Post, Get, Param, Body, UseGuards, Request, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ConversationService } from './conversation.service'
import type { SupportedLanguage } from '@language-app/shared'

class CreateSessionDto {
  @ApiProperty({ enum: ['en', 'ja'] })
  @IsString() language!: SupportedLanguage

  @ApiProperty({ enum: ['free', 'interview', 'shopping', 'restaurant'], example: 'free' })
  @IsString() scenario!: string
}

class SendMessageDto {
  @ApiProperty({ example: 'Hello, how are you?' })
  @IsString() text!: string
}

@ApiTags('conversation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('sessions')
  @ApiOperation({ summary: '회화 세션 생성' })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({ status: 201, description: '생성된 ConversationSession' })
  createSession(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateSessionDto,
  ) {
    return this.conversationService.createSession(req.user.sub, dto.language, dto.scenario)
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '세션 조회 (메시지 포함)' })
  @ApiParam({ name: 'id', description: '세션 UUID' })
  @ApiResponse({ status: 200, description: 'ConversationSession with messages' })
  getSession(@Param('id') id: string) {
    return this.conversationService.getSession(id)
  }

  @Post('sessions/:id/messages')
  @ApiOperation({
    summary: 'AI에게 메시지 전송 (SSE 스트리밍)',
    description: 'Content-Type: text/event-stream 으로 청크 스트리밍. 각 이벤트: `data: {"chunk":"..."}`, 종료: `data: [DONE]`',
  })
  @ApiParam({ name: 'id', description: '세션 UUID' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 200, description: 'SSE stream' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: { raw: import('http').ServerResponse },
  ) {
    res.raw.setHeader('Content-Type', 'text/event-stream')
    res.raw.setHeader('Cache-Control', 'no-cache')
    res.raw.setHeader('Connection', 'keep-alive')

    for await (const chunk of this.conversationService.sendMessage(id, dto.text)) {
      res.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    }
    res.raw.write('data: [DONE]\n\n')
    res.raw.end()
  }

  @Post('sessions/:id/end')
  @ApiOperation({ summary: '세션 종료 및 AI 피드백', description: 'AI가 대화 전체를 분석해 문법 교정 및 요약 반환' })
  @ApiParam({ name: 'id', description: '세션 UUID' })
  @ApiResponse({ status: 201, description: '대화 분석 결과' })
  endSession(@Param('id') id: string) {
    return this.conversationService.endSession(id)
  }
}
