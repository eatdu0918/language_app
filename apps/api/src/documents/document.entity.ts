import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  title!: string

  @Column({ type: 'text' })
  content!: string

  @Column({ type: 'varchar' })
  language!: SupportedLanguage

  @Column({ type: 'varchar', default: 'beginner' })
  level!: ProficiencyLevel

  @Column({ default: 5 })
  estimatedReadingMinutes!: number

  @Column({ type: 'simple-array', default: '' })
  tags!: string[]

  @CreateDateColumn()
  createdAt!: Date
}
