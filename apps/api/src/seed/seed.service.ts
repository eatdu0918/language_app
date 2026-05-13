import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { VocabularyWord } from '../vocabulary/vocabulary-word.entity'
import { Document } from '../documents/document.entity'

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name)

  constructor(
    @InjectRepository(VocabularyWord) private readonly wordRepo: Repository<VocabularyWord>,
    @InjectRepository(Document) private readonly documentRepo: Repository<Document>,
  ) {}

  async onApplicationBootstrap() {
    await Promise.all([this.seedVocabulary(), this.seedDocuments()])
  }

  private async seedVocabulary() {
    const count = await this.wordRepo.count()
    if (count > 0) return

    const words: Partial<VocabularyWord>[] = [
      // JLPT N5 일본어
      { word: '人', reading: 'ひと', meaning: '사람', exampleSentence: '彼は親切な人です。', exampleTranslation: '그는 친절한 사람입니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '本', reading: 'ほん', meaning: '책', exampleSentence: '本を読みます。', exampleTranslation: '책을 읽습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '水', reading: 'みず', meaning: '물', exampleSentence: '水を飲んでください。', exampleTranslation: '물을 마셔 주세요.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '山', reading: 'やま', meaning: '산', exampleSentence: '山が高いです。', exampleTranslation: '산이 높습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '川', reading: 'かわ', meaning: '강', exampleSentence: '川で泳ぎます。', exampleTranslation: '강에서 수영합니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '学校', reading: 'がっこう', meaning: '학교', exampleSentence: '学校に行きます。', exampleTranslation: '학교에 갑니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '友達', reading: 'ともだち', meaning: '친구', exampleSentence: '友達と遊びます。', exampleTranslation: '친구와 놉니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '先生', reading: 'せんせい', meaning: '선생님', exampleSentence: '先生は親切です。', exampleTranslation: '선생님은 친절합니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '명사'] },
      { word: '食べる', reading: 'たべる', meaning: '먹다', exampleSentence: 'ご飯を食べます。', exampleTranslation: '밥을 먹습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '飲む', reading: 'のむ', meaning: '마시다', exampleSentence: 'お茶を飲みます。', exampleTranslation: '차를 마십니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '行く', reading: 'いく', meaning: '가다', exampleSentence: '駅に行きます。', exampleTranslation: '역에 갑니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '来る', reading: 'くる', meaning: '오다', exampleSentence: '友達が来ます。', exampleTranslation: '친구가 옵니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '見る', reading: 'みる', meaning: '보다', exampleSentence: 'テレビを見ます。', exampleTranslation: '텔레비전을 봅니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '聞く', reading: 'きく', meaning: '듣다', exampleSentence: '音楽を聞きます。', exampleTranslation: '음악을 듣습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '話す', reading: 'はなす', meaning: '말하다', exampleSentence: '日本語で話します。', exampleTranslation: '일본어로 말합니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '동사'] },
      { word: '大きい', reading: 'おおきい', meaning: '크다', exampleSentence: 'この家は大きいです。', exampleTranslation: '이 집은 큽니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '형용사'] },
      { word: '小さい', reading: 'ちいさい', meaning: '작다', exampleSentence: '小さい犬がいます。', exampleTranslation: '작은 개가 있습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '형용사'] },
      { word: '新しい', reading: 'あたらしい', meaning: '새롭다', exampleSentence: '新しいカバンを買いました。', exampleTranslation: '새 가방을 샀습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '형용사'] },
      { word: '古い', reading: 'ふるい', meaning: '오래되다', exampleSentence: 'この建物は古いです。', exampleTranslation: '이 건물은 오래됐습니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '형용사'] },
      { word: '高い', reading: 'たかい', meaning: '높다/비싸다', exampleSentence: 'このレストランは高いです。', exampleTranslation: '이 레스토랑은 비쌉니다.', language: 'ja', level: 'beginner', tags: ['JLPT-N5', '형용사'] },

      // TOEIC 영어
      { word: 'accomplish', reading: null, meaning: '달성하다', exampleSentence: 'She accomplished her goal ahead of schedule.', exampleTranslation: '그녀는 일정보다 앞서 목표를 달성했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'acquire', reading: null, meaning: '습득하다, 얻다', exampleSentence: 'He acquired new skills during the training.', exampleTranslation: '그는 교육 중에 새로운 기술을 습득했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'analyze', reading: null, meaning: '분석하다', exampleSentence: 'The team analyzed the market data carefully.', exampleTranslation: '팀이 시장 데이터를 신중하게 분석했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'assess', reading: null, meaning: '평가하다', exampleSentence: 'We need to assess the risks before proceeding.', exampleTranslation: '진행하기 전에 위험을 평가해야 합니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'benefit', reading: null, meaning: '혜택, 이점', exampleSentence: 'Exercise has many health benefits.', exampleTranslation: '운동에는 많은 건강상의 이점이 있습니다.', language: 'en', level: 'beginner', tags: ['TOEIC', '명사'] },
      { word: 'collaborate', reading: null, meaning: '협력하다', exampleSentence: 'Our teams collaborate on international projects.', exampleTranslation: '우리 팀은 국제 프로젝트에서 협력합니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'deadline', reading: null, meaning: '마감 기한', exampleSentence: 'Please submit the report before the deadline.', exampleTranslation: '마감 기한 전에 보고서를 제출해 주세요.', language: 'en', level: 'beginner', tags: ['TOEIC', '명사'] },
      { word: 'efficient', reading: null, meaning: '효율적인', exampleSentence: 'The new process is more efficient than before.', exampleTranslation: '새로운 과정이 이전보다 더 효율적입니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '형용사'] },
      { word: 'implement', reading: null, meaning: '실행하다, 구현하다', exampleSentence: 'We will implement the new policy next month.', exampleTranslation: '다음 달에 새로운 정책을 실행할 것입니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'negotiate', reading: null, meaning: '협상하다', exampleSentence: 'They negotiated a favorable contract with the supplier.', exampleTranslation: '그들은 공급업체와 유리한 계약을 협상했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'objective', reading: null, meaning: '목표, 객관적인', exampleSentence: 'Our main objective is to increase customer satisfaction.', exampleTranslation: '우리의 주요 목표는 고객 만족도를 높이는 것입니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '명사/형용사'] },
      { word: 'priority', reading: null, meaning: '우선순위', exampleSentence: 'Customer safety is our top priority.', exampleTranslation: '고객 안전이 최우선 사항입니다.', language: 'en', level: 'beginner', tags: ['TOEIC', '명사'] },
      { word: 'productive', reading: null, meaning: '생산적인', exampleSentence: 'We had a very productive meeting this morning.', exampleTranslation: '오늘 아침 매우 생산적인 회의를 했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '형용사'] },
      { word: 'proposal', reading: null, meaning: '제안서', exampleSentence: 'Please submit your proposal by Friday.', exampleTranslation: '금요일까지 제안서를 제출해 주세요.', language: 'en', level: 'beginner', tags: ['TOEIC', '명사'] },
      { word: 'strategy', reading: null, meaning: '전략', exampleSentence: 'The company developed a new marketing strategy.', exampleTranslation: '회사는 새로운 마케팅 전략을 개발했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '명사'] },
      { word: 'supervise', reading: null, meaning: '감독하다', exampleSentence: 'She supervises a team of ten engineers.', exampleTranslation: '그녀는 10명의 엔지니어 팀을 감독합니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'sustainable', reading: null, meaning: '지속 가능한', exampleSentence: 'We need sustainable solutions for the environment.', exampleTranslation: '환경을 위한 지속 가능한 해결책이 필요합니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '형용사'] },
      { word: 'allocate', reading: null, meaning: '배분하다', exampleSentence: 'The manager allocated resources to each department.', exampleTranslation: '관리자가 각 부서에 자원을 배분했습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'anticipate', reading: null, meaning: '예상하다', exampleSentence: 'We anticipate strong sales in the fourth quarter.', exampleTranslation: '4분기에 강한 판매를 예상합니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
      { word: 'authorize', reading: null, meaning: '승인하다', exampleSentence: 'Only the manager can authorize this expense.', exampleTranslation: '이 비용은 관리자만 승인할 수 있습니다.', language: 'en', level: 'intermediate', tags: ['TOEIC', '동사'] },
    ]

    await this.wordRepo.save(words)
    this.logger.log(`Seeded ${words.length} vocabulary words`)
  }

  private async seedDocuments() {
    const count = await this.documentRepo.count()
    if (count > 0) return

    const documents: Partial<Document>[] = [
      {
        title: 'My Daily Routine',
        content: `I wake up at 7 o'clock every morning. First, I wash my face and brush my teeth. Then, I eat breakfast. I usually have toast and coffee. After breakfast, I go to work by train. At work, I sit at my desk and check my emails. I have lunch at noon with my colleagues. We usually go to a nearby restaurant. In the afternoon, I attend meetings and work on reports. I finish work at 6 o'clock. In the evening, I come home and cook dinner. After dinner, I watch TV or read a book. I go to bed at 10 o'clock.`,
        language: 'en',
        level: 'beginner',
        estimatedReadingMinutes: 2,
        tags: ['일상', '루틴'],
      },
      {
        title: 'The Benefits of Learning a New Language',
        content: `Learning a new language offers numerous advantages that extend far beyond simple communication. Research has consistently shown that bilingual individuals demonstrate enhanced cognitive flexibility, improved problem-solving abilities, and greater mental resilience as they age. The process of acquiring a second language forces the brain to constantly switch between linguistic systems, which strengthens executive function and attention control.

Furthermore, language learning provides unique cultural insights, enabling learners to understand diverse perspectives and build meaningful connections across cultural boundaries. Many professionals report that their language skills opened doors to international career opportunities that would otherwise have been inaccessible. In our increasingly globalized economy, multilingual employees are often considered valuable assets by employers.

Beyond career benefits, speaking another language allows travelers to experience foreign cultures more authentically, moving beyond tourist attractions to genuine interactions with local communities. Whether your motivation is professional advancement, cultural exploration, or cognitive enhancement, the investment of time and effort in language learning consistently yields significant rewards.`,
        language: 'en',
        level: 'intermediate',
        estimatedReadingMinutes: 4,
        tags: ['교육', '언어학습'],
      },
      {
        title: '自己紹介',
        content: `はじめまして。私の名前は田中さくらです。東京に住んでいます。大学で英語を勉強しています。毎日、単語を10個覚えます。週に3回、先生と会話の練習をします。

日本語はむずかしいですが、とても楽しいです。いつか日本に行きたいです。日本の食べ物が好きです。すしとラーメンが特に好きです。

趣味は音楽を聞くことと、映画を見ることです。週末は友達と公園に行きます。どうぞよろしくお願いします。`,
        language: 'ja',
        level: 'beginner',
        estimatedReadingMinutes: 2,
        tags: ['자기소개', '일상'],
      },
      {
        title: '日本の四季',
        content: `日本には美しい四季があります。それぞれの季節が独自の魅力を持っており、人々の生活や文化に深く影響を与えています。

春になると、各地で桜が咲き始め、公園や川沿いを淡いピンク色に彩ります。この時期、多くの人々が家族や友人と一緒に花見を楽しみます。桜の季節は約2週間と短いため、日本人はこの美しい瞬間を大切にします。

夏は気温が高く湿度も上がりますが、海水浴や花火大会、お祭りなど様々なイベントが各地で開催されます。特に夏祭りでは浴衣を着た人々が多く見られ、日本の伝統文化を感じることができます。

秋になると、山々の木々が赤や黄色、オレンジ色に染まる紅葉が見られます。この美しい光景を楽しもうと、多くの観光客が日本各地の名所を訪れます。また、秋は食べ物がおいしい季節としても知られており、新米や栗、きのこなどの旬の食材が楽しめます。

冬は寒さが厳しくなり、北海道や東北地方では大量の雪が降ります。スキーやスノーボードを楽しむ人も多く、温泉地も人気を集めます。また、クリスマスやお正月など、冬には重要な行事が続きます。`,
        language: 'ja',
        level: 'intermediate',
        estimatedReadingMinutes: 5,
        tags: ['문화', '계절', '자연'],
      },
    ]

    await this.documentRepo.save(documents)
    this.logger.log(`Seeded ${documents.length} documents`)
  }
}
