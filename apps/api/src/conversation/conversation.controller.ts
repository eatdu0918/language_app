import { Controller, Post, Get, Param, Body, UseGuards, Request, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ConversationService } from './conversation.service'
import type { SupportedLanguage } from '@language-app/shared'

class CreateSessionDto {
  @IsString() language!: SupportedLanguage
  @IsString() scenario!: string
}

class SendMessageDto {
  @IsString() text!: string
}

@ApiTags('conversation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('sessions')
  createSession(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateSessionDto,
  ) {
    return this.conversationService.createSession(req.user.sub, dto.language, dto.scenario)
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.conversationService.getSession(id)
  }

  @Post('sessions/:id/messages')
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
  endSession(@Param('id') id: string) {
    return this.conversationService.endSession(id)
  }
}
