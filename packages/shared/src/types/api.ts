export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  subscriptionTier: import('./language').SubscriptionTier
  targetLanguages: import('./language').SupportedLanguage[]
  levels: Record<import('./language').SupportedLanguage, import('./language').ProficiencyLevel>
  placementCompleted: boolean
  createdAt: string
}

// AI
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIProvider {
  chat(messages: AIMessage[], options?: AIOptions): Promise<string>
  stream(messages: AIMessage[], options?: AIOptions): AsyncIterable<string>
}

export interface AIOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

// Speech
export interface TranscribeRequest {
  language?: import('./language').SupportedLanguage
}

export interface TranscribeResponse {
  text: string
  language: string
  duration: number
}
