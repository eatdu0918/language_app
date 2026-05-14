import type { SupportedLanguage, ProficiencyLevel, ExamType, ExamLevel } from './language'

// Placement test
export interface PlacementQuestion {
  id: string
  question: string
  options: string[]
}

export interface PlacementResult {
  level: ProficiencyLevel
  score: number
  total: number
}

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

// 시험 준비 (TOEIC / JLPT)
export interface ExamQuestion {
  id: string
  examType: ExamType
  level: ExamLevel
  category: 'vocabulary' | 'grammar' | 'reading'
  question: string
  options: string[]
  answer: number       // 정답 인덱스 (0~3)
  explanation: string
}

export interface SessionAnswer {
  questionId: string
  selected: number
  correct: boolean
}

export interface ExamSession {
  id: string
  examType: ExamType
  level: ExamLevel
  questions: ExamQuestion[]
  answers: SessionAnswer[]
  score: number
  totalQuestions: number
  completedAt: string | null
  startedAt: string
}

export interface ExamLevelStats {
  level: ExamLevel
  bestScore: number
  attempts: number
  lastAttemptAt: string | null
  passed: boolean   // 70% 이상
}

export interface ExamStats {
  toeic: ExamLevelStats[]
  jlpt: ExamLevelStats[]
}
