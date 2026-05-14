import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, HttpCode } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiBody, ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, IsArray, Min, Max, ValidateNested, ArrayMinSize, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ExamService } from './exam.service'
import type { ExamType, ExamLevel } from '@language-app/shared'

class AnswerItemDto {
  @ApiProperty({ example: 'uuid-of-question' })
  @IsString() questionId!: string

  @ApiProperty({ minimum: 0, maximum: 3 })
  @IsNumber() @Min(0) @Max(3) selected!: number
}

class SubmitSessionDto {
  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[]
}

class GenerateDto {
  @ApiProperty({ enum: ['toeic', 'jlpt'] })
  @IsString() examType!: ExamType

  @ApiProperty({ description: 'toeic-200 ~ toeic-900 | N5 ~ N1' })
  @IsString() level!: ExamLevel

  @ApiProperty({ minimum: 1, maximum: 10, required: false, default: 5 })
  @IsOptional() @IsNumber() @Min(1) @Max(10) count?: number
}

@ApiTags('exam')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get('questions')
  @ApiOperation({ summary: '레벨별 문제 조회' })
  @ApiQuery({ name: 'examType', enum: ['toeic', 'jlpt'] })
  @ApiQuery({ name: 'level', description: 'toeic-200 ~ toeic-900 | N5 ~ N1' })
  getQuestions(
    @Query('examType') examType: ExamType,
    @Query('level') level: ExamLevel,
  ) {
    return this.examService.getQuestions(examType, level)
  }

  @Post('generate')
  @ApiOperation({ summary: 'AI로 새 문제 생성 (Claude/Ollama)' })
  generate(@Body() dto: GenerateDto) {
    return this.examService.generateQuestionsWithAI(dto.examType, dto.level, dto.count ?? 5)
  }

  @Post('sessions')
  @ApiOperation({ summary: '시험 세션 시작' })
  @ApiBody({ schema: { properties: { examType: { type: 'string' }, level: { type: 'string' } } } })
  startSession(
    @Request() req: { user: { sub: string } },
    @Body() body: { examType: ExamType; level: ExamLevel },
  ) {
    return this.examService.startSession(req.user.sub, body.examType, body.level)
  }

  @Post('sessions/:id/submit')
  @HttpCode(200)
  @ApiOperation({ summary: '답안 제출 및 채점 (오답 단어 자동 등록 포함)' })
  submit(
    @Request() req: { user: { sub: string } },
    @Param('id') sessionId: string,
    @Body() dto: SubmitSessionDto,
  ) {
    return this.examService.submitSession(req.user.sub, sessionId, dto.answers)
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '세션 결과 조회 (문제 포함)' })
  getSession(
    @Request() req: { user: { sub: string } },
    @Param('id') sessionId: string,
  ) {
    return this.examService.getSessionWithQuestions(req.user.sub, sessionId)
  }

  @Get('history')
  @ApiOperation({ summary: '시험 기록 조회' })
  @ApiQuery({ name: 'examType', enum: ['toeic', 'jlpt'], required: false })
  getHistory(
    @Request() req: { user: { sub: string } },
    @Query('examType') examType?: ExamType,
  ) {
    return this.examService.getHistory(req.user.sub, examType)
  }

  @Get('stats')
  @ApiOperation({ summary: '레벨별 통계' })
  getStats(@Request() req: { user: { sub: string } }) {
    return this.examService.getStats(req.user.sub)
  }

  @Get('analysis')
  @ApiOperation({ summary: '카테고리별 약점 분석 (vocabulary / grammar / reading)' })
  getAnalysis(@Request() req: { user: { sub: string } }) {
    return this.examService.getAnalysis(req.user.sub)
  }
}
