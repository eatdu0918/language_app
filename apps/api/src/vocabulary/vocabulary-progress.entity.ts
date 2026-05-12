import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'
import { VocabularyWord } from './vocabulary-word.entity'

@Entity('vocabulary_progress')
export class VocabularyProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @ManyToOne(() => VocabularyWord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word!: VocabularyWord

  @Column({ default: 1 })
  interval!: number

  @Column({ type: 'float', default: 2.5 })
  easeFactor!: number

  @Column({ default: 0 })
  repetitions!: number

  @Column({ type: 'timestamp' })
  dueDate!: Date

  @Column({ type: 'timestamp', nullable: true })
  lastReviewedAt!: Date | null
}
