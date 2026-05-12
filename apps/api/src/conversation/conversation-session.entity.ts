import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany, CreateDateColumn,
} from 'typeorm'
import { User } from '../users/user.entity'
import { ConversationMessage } from './conversation-message.entity'
import type { SupportedLanguage } from '@language-app/shared'

@Entity('conversation_sessions')
export class ConversationSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'varchar' })
  language!: SupportedLanguage

  @Column({ default: 'free' })
  scenario!: string

  @OneToMany(() => ConversationMessage, (m) => m.session, { cascade: true })
  messages!: ConversationMessage[]

  @CreateDateColumn()
  startedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null
}
