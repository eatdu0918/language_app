import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  app.enableCors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' })
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(new GlobalExceptionFilter())

  const config = new DocumentBuilder()
    .setTitle('Language App API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))

  const port = process.env['PORT'] ?? 3001
  await app.listen(port, '0.0.0.0')
  console.log(`API running on http://localhost:${port}`)
  console.log(`Docs at http://localhost:${port}/docs`)
}

bootstrap()
