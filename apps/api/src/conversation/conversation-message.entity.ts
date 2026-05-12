import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { ConversationSession } from './conversation-session.entity'

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => ConversationSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: ConversationSession

  @Column({ type: 'varchar' })
  role!: 'user' | 'assistant'

  @Column({ type: 'text' })
  content!: string

  @Column({ nullable: true, type: 'jsonb' })
  corrections!: Array<{ original: string; corrected: string; explanation: string }> | null

  @CreateDateColumn()
  timestamp!: Date
}
