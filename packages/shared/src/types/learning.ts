import type { SupportedLanguage, ProficiencyLevel } from './language'

// Vocabulary
export interface VocabularyWord {
  id: string
  word: string
  reading?: string        // 일본어 후리가나
  meaning: string         // 한국어 뜻
  exampleSentence: string
  exampleTranslation: string
  language: SupportedLanguage
  level: ProficiencyLevel
  tags: string[]
}

export interface VocabularyStats {
  dueToday: number
  reviewedToday: number
  totalLearned: number
}

export interface VocabularyProgress {
  id: string
  word: VocabularyWord
  interval: number        // SRS: 다음 복습까지 일수
  easeFactor: number      // SRS: 난이도 계수 (SM-2)
  repetitions: number
  dueDate: string
  lastReviewedAt: string | null
}

// Document
export interface Document {
  id: string
  title: string
  content: string
  language: SupportedLanguage
  level: ProficiencyLevel
  estimatedReadingMinutes: number
  tags: string[]
  createdAt: string
}

// Conversation
export interface ConversationSession {
  id: string
  userId: string
  language: SupportedLanguage
  scenario: string        // 'free' | 'interview' | 'shopping' | 'restaurant'
  messages: ConversationMessage[]
  startedAt: string
  endedAt: string | null
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string
  corrections?: GrammarCorrection[]
  timestamp: string
}

export interface GrammarCorrection {
  original: string
  corrected: string
  explanation: string
}
