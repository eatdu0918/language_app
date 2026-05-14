export type SupportedLanguage = 'en' | 'ja'

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'native'

export type LearningCategory = 'vocabulary' | 'document' | 'conversation'

export type SubscriptionTier = 'free' | 'basic' | 'pro'

// 시험 준비 타입
export type ExamType = 'toeic' | 'jlpt'

// TOEIC 점수대별 레벨 (목표 점수 기준)
export type ToeicLevel = 'toeic-200' | 'toeic-400' | 'toeic-600' | 'toeic-800' | 'toeic-900'

// JLPT 레벨 (N5 = 초급, N1 = 최고급)
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export type ExamLevel = ToeicLevel | JlptLevel
