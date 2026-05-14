import { Injectable, Inject } from '@nestjs/common'
import { AI_PROVIDER } from './ai.module'
import type { AIProvider, SupportedLanguage } from '@language-app/shared'

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  async generateVocabularyExample(word: string, language: SupportedLanguage): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.provider.chat([
      {
        role: 'system',
        content: `You are a ${langName} language teacher. Respond in JSON only.`,
      },
      {
        role: 'user',
        content: `Create 2 natural example sentences for the word "${word}" in ${langName}.
Return JSON: { "examples": [{ "sentence": string, "translation": string }] }`,
      },
    ])
  }

  async analyzeConversation(transcript: string, language: SupportedLanguage): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.provider.chat([
      {
        role: 'system',
        content: `You are a ${langName} language coach for Korean speakers. Respond in Korean + JSON.`,
      },
      {
        role: 'user',
        content: `Analyze this ${langName} text for grammar errors and unnatural expressions.
Text: "${transcript}"
Return JSON: { "corrections": [{ "original": string, "corrected": string, "explanation": string }], "overall": string }`,
      },
    ])
  }

  async *conversationStream(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: SupportedLanguage,
    scenario: string,
  ): AsyncIterable<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    yield* this.provider.stream([
      {
        role: 'system',
        content: `You are a friendly ${langName} conversation partner for a Korean learner.
Scenario: ${scenario}.
- Respond only in ${langName}
- Keep sentences natural and at intermediate level
- After your response add: [CORRECTION: if any error existed, brief Korean explanation]`,
      },
      ...history,
    ])
  }

  async generateExamQuestions(
    examType: 'toeic' | 'jlpt',
    level: string,
    count: number,
  ): Promise<string> {
    const levelDesc =
      examType === 'toeic'
        ? `TOEIC (목표 점수 ${level.replace('toeic-', '')}점대)`
        : `JLPT ${level}`
    const lang = examType === 'toeic' ? 'English' : 'Japanese'

    return this.provider.chat([
      { role: 'system', content: 'You are a language exam question generator. Respond ONLY with a valid JSON array. No markdown, no explanation, just the JSON.' },
      {
        role: 'user',
        content: `Generate exactly ${count} ${levelDesc} exam questions for Korean learners studying ${lang}.
The questions should test ${lang} at the ${level} proficiency level.
Mix "vocabulary" and "grammar" categories.

Return ONLY this JSON array:
[
  {
    "category": "vocabulary",
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "answer": 0,
    "explanation": "한국어로 정답 해설"
  }
]

Rules:
- answer must be the index (0-3) of the correct option in options array
- options must have exactly 4 items
- explanation must be in Korean
- question may be in ${lang} or Korean
- Do NOT add any text outside the JSON array`,
      },
    ])
  }

  async adjustDocumentLevel(
    content: string,
    targetLevel: string,
    language: SupportedLanguage,
  ): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.provider.chat([
      { role: 'system', content: `You are a ${langName} text editor.` },
      {
        role: 'user',
        content: `Rewrite this ${langName} text for a ${targetLevel} level learner. Keep the meaning.
Original: "${content}"
Return only the rewritten text.`,
      },
    ])
  }
}
