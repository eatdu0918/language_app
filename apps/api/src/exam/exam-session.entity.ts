import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../users/user.entity'
import type { ExamType, ExamLevel } from '@language-app/shared'

export interface SessionAnswer {
  questionId: string
  selected: number
  correct: boolean
}

@Entity('exam_sessions')
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User

  @Column({ type: 'varchar' })
  examType!: ExamType

  @Column({ type: 'varchar' })
  level!: ExamLevel

  @Column({ type: 'int', default: 0 })
  score!: number

  @Column({ type: 'int' })
  totalQuestions!: number

  @Column({ type: 'simple-json', default: '[]' })
  answers!: SessionAnswer[]

  @CreateDateColumn()
  startedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null
}
