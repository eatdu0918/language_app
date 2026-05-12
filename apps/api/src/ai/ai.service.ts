import { Injectable } from '@nestjs/common'
import { OllamaProvider } from './providers/ollama.provider'
import type { SupportedLanguage } from '@language-app/shared'

@Injectable()
export class AiService {
  constructor(private readonly ollama: OllamaProvider) {}

  async generateVocabularyExample(word: string, language: SupportedLanguage): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.ollama.chat([
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

  async analyzeConversation(
    transcript: string,
    language: SupportedLanguage,
  ): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.ollama.chat([
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
    yield* this.ollama.stream([
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

  async adjustDocumentLevel(
    content: string,
    targetLevel: string,
    language: SupportedLanguage,
  ): Promise<string> {
    const langName = language === 'en' ? 'English' : 'Japanese'
    return this.ollama.chat([
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
