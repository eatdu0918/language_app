import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import type { SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

@Entity('vocabulary_words')
export class VocabularyWord {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  word!: string

  @Column({ nullable: true, type: 'varchar' })
  reading!: string | null

  @Column()
  meaning!: string

  @Column({ type: 'text' })
  exampleSentence!: string

  @Column({ type: 'text' })
  exampleTranslation!: string

  @Column({ type: 'varchar' })
  language!: SupportedLanguage

  @Column({ type: 'varchar', default: 'beginner' })
  level!: ProficiencyLevel

  @Column({ type: 'simple-array', default: '' })
  tags!: string[]

  @CreateDateColumn()
  createdAt!: Date
}
