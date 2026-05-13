import { Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import type { SupportedLanguage, ProficiencyLevel, PlacementQuestion } from '@language-app/shared'

interface Question extends PlacementQuestion {
  correctAnswer: string
  level: ProficiencyLevel
}

const EN_QUESTIONS: Question[] = [
  {
    id: 'en_1', level: 'beginner',
    question: '"I ___ a student." 빈칸에 알맞은 것은?',
    options: ['am', 'is', 'are', 'be'],
    correctAnswer: 'am',
  },
  {
    id: 'en_2', level: 'beginner',
    question: '"go"의 과거형은?',
    options: ['goed', 'went', 'gone', 'going'],
    correctAnswer: 'went',
  },
  {
    id: 'en_3', level: 'elementary',
    question: '"She has ___ this movie before." 빈칸에 알맞은 것은?',
    options: ['see', 'saw', 'seen', 'seeing'],
    correctAnswer: 'seen',
  },
  {
    id: 'en_4', level: 'elementary',
    question: '"If I ___ you, I would study harder." 빈칸에 알맞은 것은?',
    options: ['am', 'was', 'were', 'be'],
    correctAnswer: 'were',
  },
  {
    id: 'en_5', level: 'intermediate',
    question: '"The letter ___ last week." 빈칸에 알맞은 것은?',
    options: ['sent', 'was sent', 'has sent', 'is sent'],
    correctAnswer: 'was sent',
  },
  {
    id: 'en_6', level: 'intermediate',
    question: '"Despite ___ tired, she continued working." 빈칸에 알맞은 것은?',
    options: ['be', 'being', 'to be', 'been'],
    correctAnswer: 'being',
  },
  {
    id: 'en_7', level: 'intermediate',
    question: '"very careful about details"를 뜻하는 단어는?',
    options: ['careless', 'meticulous', 'hasty', 'vague'],
    correctAnswer: 'meticulous',
  },
  {
    id: 'en_8', level: 'advanced',
    question: '"No sooner ___ than the alarm went off." 빈칸에 알맞은 것은?',
    options: ['she had arrived', 'had she arrived', 'did she arrive', 'she arrived'],
    correctAnswer: 'had she arrived',
  },
  {
    id: 'en_9', level: 'advanced',
    question: '"상황을 더 나쁘게 만들다"를 뜻하는 단어는?',
    options: ['ameliorate', 'mitigate', 'exacerbate', 'alleviate'],
    correctAnswer: 'exacerbate',
  },
  {
    id: 'en_10', level: 'advanced',
    question: '"The committee ___ over the proposal for hours." 빈칸에 알맞은 것은?',
    options: ['deliberated', 'deliberating', 'deliberates', 'have deliberated'],
    correctAnswer: 'deliberated',
  },
]

const JA_QUESTIONS: Question[] = [
  {
    id: 'ja_1', level: 'beginner',
    question: '「本を読___ください。」빈칸에 알맞은 것은?',
    options: ['む', 'んで', 'み', 'みて'],
    correctAnswer: 'んで',
  },
  {
    id: 'ja_2', level: 'beginner',
    question: '「昨日、映画を___。」빈칸에 알맞은 것은?',
    options: ['見ます', '見ました', '見て', '見る'],
    correctAnswer: '見ました',
  },
  {
    id: 'ja_3', level: 'beginner',
    question: '「私は学校___行きます。」빈칸에 알맞은 것은?',
    options: ['に', 'で', 'が', 'を'],
    correctAnswer: 'に',
  },
  {
    id: 'ja_4', level: 'elementary',
    question: '「もっと___話してください。」(천천히 말해달라는 뜻) 빈칸에 알맞은 것은?',
    options: ['ゆっくり', 'はやく', 'たかく', 'ながく'],
    correctAnswer: 'ゆっくり',
  },
  {
    id: 'ja_5', level: 'elementary',
    question: '「日本語が___なりました。」빈칸에 알맞은 것은?',
    options: ['上手に', '上手な', '上手で', '上手く'],
    correctAnswer: '上手に',
  },
  {
    id: 'ja_6', level: 'intermediate',
    question: '「彼は来ない___です。」(예정·당연함의 의미) 빈칸에 알맞은 것은?',
    options: ['はず', 'から', 'だろう', 'けど'],
    correctAnswer: 'はず',
  },
  {
    id: 'ja_7', level: 'intermediate',
    question: '漢字「勉強」의 읽기로 올바른 것은?',
    options: ['べんきょう', 'べんごう', 'もんきょう', 'もんごう'],
    correctAnswer: 'べんきょう',
  },
  {
    id: 'ja_8', level: 'intermediate',
    question: '「この映画、面白___らしい。」빈칸에 알맞은 것은?',
    options: ['い', 'く', 'な', 'に'],
    correctAnswer: 'い',
  },
  {
    id: 'ja_9', level: 'advanced',
    question: '「___にもかかわらず、彼は諦めなかった。」빈칸에 알맞은 것은?',
    options: ['難しい', '難し', '難しく', '難しな'],
    correctAnswer: '難しい',
  },
  {
    id: 'ja_10', level: 'advanced',
    question: '「深い意味や含み」를 뜻하는 단어는?',
    options: ['含蓄', '含意', '暗示', '誤解'],
    correctAnswer: '含蓄',
  },
]

const QUESTIONS: Record<SupportedLanguage, Question[]> = { en: EN_QUESTIONS, ja: JA_QUESTIONS }

function scoreToLevel(score: number): ProficiencyLevel {
  if (score <= 3) return 'beginner'
  if (score <= 5) return 'elementary'
  if (score <= 7) return 'intermediate'
  return 'advanced'
}

@Injectable()
export class PlacementService {
  constructor(private readonly usersService: UsersService) {}

  getQuestions(language: SupportedLanguage): PlacementQuestion[] {
    return QUESTIONS[language].map(({ id, question, options }) => ({ id, question, options }))
  }

  async submit(userId: string, language: SupportedLanguage, answers: Record<string, string>) {
    const questions = QUESTIONS[language]
    const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0)
    const level = scoreToLevel(score)
    await this.usersService.completePlacement(userId, language, level)
    return { level, score, total: questions.length }
  }
}
