import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

interface FastifyLikeReply {
  status(code: number): FastifyLikeReply
  send(body: unknown): void
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyLikeReply>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let error = 'Internal Server Error'

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const response = exception.getResponse()
      if (typeof response === 'string') {
        message = response
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>
        message = (r['message'] as string | string[]) ?? message
        error = (r['error'] as string) ?? error
      }
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception))
    }

    void reply.status(statusCode).send({ statusCode, message, error })
  }
}
