import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiModule } from '../ai/ai.module'
import { Document } from './document.entity'
import { DocumentsService } from './documents.service'
import { DocumentsController } from './documents.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Document]), AiModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
