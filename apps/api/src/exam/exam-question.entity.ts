import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import type { ExamType, ExamLevel } from '@language-app/shared'

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  examType!: ExamType

  @Column({ type: 'varchar' })
  level!: ExamLevel

  @Column({ type: 'varchar' })
  category!: 'vocabulary' | 'grammar' | 'reading'

  @Column({ type: 'text' })
  question!: string

  @Column({ type: 'simple-json' })
  options!: string[]

  @Column({ type: 'int' })
  answer!: number   // 정답 인덱스 (0~3)

  @Column({ type: 'text' })
  explanation!: string

  @CreateDateColumn()
  createdAt!: Date
}
