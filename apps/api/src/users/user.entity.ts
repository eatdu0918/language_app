import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm'
import type { SupportedLanguage, ProficiencyLevel, SubscriptionTier } from '@language-app/shared'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  @Column()
  name!: string

  @Column({ select: false })
  passwordHash!: string

  @Column({ type: 'varchar', default: 'free' })
  subscriptionTier!: SubscriptionTier

  @Column({ type: 'simple-array', default: 'en' })
  targetLanguages!: SupportedLanguage[]

  @Column({ type: 'jsonb', default: { en: 'beginner', ja: 'beginner' } })
  levels!: Record<SupportedLanguage, ProficiencyLevel>

  @Column({ default: false })
  placementCompleted!: boolean

  @Column({ nullable: true, type: 'varchar' })
  stripeCustomerId!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
