import { Client } from 'pg'

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config()
} catch {}

const client = new Client({
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 5432),
  user: process.env['DB_USERNAME'] ?? 'language_app',
  password: process.env['DB_PASSWORD'] ?? 'language_app_password',
  database: process.env['DB_DATABASE'] ?? 'language_app',
})

const enWords = [
  { word: 'apple', reading: null, meaning: '사과', example: 'I eat an apple every morning.', translation: '나는 매일 아침 사과를 먹는다.', level: 'beginner' },
  { word: 'book', reading: null, meaning: '책', example: 'She reads a book before bed.', translation: '그녀는 잠자리에 들기 전 책을 읽는다.', level: 'beginner' },
  { word: 'run', reading: null, meaning: '달리다', example: 'He runs five kilometers every day.', translation: '그는 매일 5킬로미터를 달린다.', level: 'beginner' },
  { word: 'friend', reading: null, meaning: '친구', example: 'My best friend lives in Seoul.', translation: '내 가장 친한 친구는 서울에 산다.', level: 'beginner' },
  { word: 'happy', reading: null, meaning: '행복한', example: 'I feel happy when I learn new things.', translation: '새로운 것을 배울 때 행복하다.', level: 'beginner' },
  { word: 'beautiful', reading: null, meaning: '아름다운', example: 'The sunset is so beautiful.', translation: '노을이 정말 아름답다.', level: 'elementary' },
  { word: 'learn', reading: null, meaning: '배우다', example: 'I want to learn English fluently.', translation: '나는 영어를 유창하게 배우고 싶다.', level: 'elementary' },
  { word: 'important', reading: null, meaning: '중요한', example: 'Exercise is important for your health.', translation: '운동은 건강에 중요하다.', level: 'elementary' },
  { word: 'accomplish', reading: null, meaning: '성취하다', example: 'She accomplished all her goals this year.', translation: '그녀는 올해 모든 목표를 성취했다.', level: 'intermediate' },
  { word: 'negotiate', reading: null, meaning: '협상하다', example: 'They negotiated a new contract successfully.', translation: '그들은 성공적으로 새 계약을 협상했다.', level: 'intermediate' },
  { word: 'ambiguous', reading: null, meaning: '모호한', example: 'The instructions were ambiguous and confusing.', translation: '지시사항이 모호하고 혼란스러웠다.', level: 'advanced' },
  { word: 'eloquent', reading: null, meaning: '웅변적인, 유창한', example: 'She gave an eloquent speech at the ceremony.', translation: '그녀는 행사에서 유창한 연설을 했다.', level: 'advanced' },
]

const jaWords = [
  { word: 'ありがとう', reading: 'arigatou', meaning: '감사합니다', example: 'ありがとうございます。', translation: '감사합니다.', level: 'beginner' },
  { word: '食べる', reading: 'たべる', meaning: '먹다', example: '毎朝ごはんを食べる。', translation: '매일 아침 밥을 먹는다.', level: 'beginner' },
  { word: '見る', reading: 'みる', meaning: '보다', example: '映画を見る。', translation: '영화를 본다.', level: 'beginner' },
  { word: '友達', reading: 'ともだち', meaning: '친구', example: '友達と一緒に遊ぶ。', translation: '친구와 함께 논다.', level: 'beginner' },
  { word: '行く', reading: 'いく', meaning: '가다', example: '学校に行く。', translation: '학교에 간다.', level: 'beginner' },
  { word: '学ぶ', reading: 'まなぶ', meaning: '배우다', example: '日本語を一生懸命学ぶ。', translation: '일본어를 열심히 배운다.', level: 'elementary' },
  { word: '難しい', reading: 'むずかしい', meaning: '어렵다', example: '漢字は難しいと思う。', translation: '한자는 어렵다고 생각한다.', level: 'elementary' },
  { word: '経験', reading: 'けいけん', meaning: '경험', example: '海外での経験が役に立った。', translation: '해외에서의 경험이 도움이 됐다.', level: 'intermediate' },
  { word: '挑戦', reading: 'ちょうせん', meaning: '도전', example: '新しいことに挑戦するのは大切だ。', translation: '새로운 것에 도전하는 것은 중요하다.', level: 'intermediate' },
  { word: '概念', reading: 'がいねん', meaning: '개념', example: 'この概念を理解するのは難しい。', translation: '이 개념을 이해하기가 어렵다.', level: 'advanced' },
]

const enDocuments = [
  {
    title: 'My Daily Routine',
    content: `Every morning, I wake up at seven o'clock. First, I brush my teeth and wash my face. Then, I eat a simple breakfast with toast and eggs. After breakfast, I walk to the bus stop and take the bus to work.

At work, I check my emails and plan my tasks for the day. I usually have a meeting with my team at ten o'clock. We talk about our projects and share ideas. At noon, I eat lunch with my colleagues in the cafeteria.

In the afternoon, I focus on my work. At five o'clock, I finish work and go home. In the evening, I cook dinner, watch a little TV, and read a book before going to bed at ten.`,
    level: 'beginner',
    minutes: 3,
    tags: 'daily,routine,lifestyle',
  },
  {
    title: 'The Benefits of Exercise',
    content: `Regular exercise is one of the most important habits you can develop. Physical activity helps maintain a healthy weight, strengthens muscles and bones, and improves cardiovascular health. Studies show that people who exercise regularly live longer and have fewer chronic diseases.

Beyond physical health, exercise has powerful mental benefits. When you exercise, your brain releases endorphins, which are chemicals that make you feel happy and reduce stress. Many people find that a daily workout helps them sleep better and feel more energetic throughout the day.

You do not need to join an expensive gym to get exercise. Walking, cycling, swimming, and jogging are all excellent options. Even thirty minutes of moderate activity five days a week can make a significant difference to your health.`,
    level: 'elementary',
    minutes: 4,
    tags: 'health,fitness,lifestyle',
  },
  {
    title: 'The Rise of Remote Work',
    content: `The COVID-19 pandemic fundamentally transformed how companies around the world approach work. Virtually overnight, millions of office workers transitioned to working from home, and many organizations discovered that remote work was not only possible but often more productive than traditional office arrangements.

This shift has created both opportunities and challenges. On the positive side, remote work eliminates commuting time, allowing employees to reclaim hours each day. It also enables companies to hire talent from anywhere in the world, expanding the pool of qualified candidates beyond geographic limitations. Workers report higher job satisfaction when given flexibility over their schedules and work environments.

However, remote work is not without its difficulties. Collaboration and communication can suffer when teams are distributed across different time zones. New employees may struggle to integrate into company culture without face-to-face interaction. Additionally, the boundaries between work and personal life can blur when the office is also the home.`,
    level: 'intermediate',
    minutes: 5,
    tags: 'work,technology,society',
  },
  {
    title: 'Artificial Intelligence in Modern Society',
    content: `Artificial intelligence has transitioned from a speculative concept in science fiction to a pervasive technological reality that underpins much of modern life. Machine learning algorithms curate the content we consume on social media, optimize the routes we travel, detect fraudulent financial transactions, and increasingly assist physicians in diagnosing complex medical conditions.

The acceleration of AI development raises profound questions about the nature of intelligence, creativity, and work. As large language models demonstrate increasingly sophisticated reasoning and generative capabilities, debates intensify about the economic displacement of knowledge workers and the philosophical implications of machines that can engage in what appears to be genuine intellectual discourse.

Policymakers face the formidable challenge of crafting regulatory frameworks that encourage innovation while mitigating risks — including algorithmic bias, privacy erosion, and the potential concentration of power among the few entities capable of developing and deploying frontier AI systems. The decisions made in the coming decade will likely shape the trajectory of human civilization for generations.`,
    level: 'advanced',
    minutes: 6,
    tags: 'technology,ai,society',
  },
]

const jaDocuments = [
  {
    title: '私の毎日',
    content: `毎朝、七時に起きます。まず、歯を磨いて顔を洗います。それから、朝ごはんを食べます。トーストと卵の簡単な朝ごはんです。朝ごはんの後、バス停まで歩いて、バスで会社に行きます。

会社では、まずメールをチェックして、その日のタスクを計画します。十時に、チームとミーティングをします。プロジェクトについて話し合い、アイデアを共有します。お昼に、カフェテリアで同僚と一緒に昼ごはんを食べます。

午後は、仕事に集中します。五時に仕事が終わり、家に帰ります。夜は、夕ごはんを作り、少しテレビを見て、本を読んでから十時に寝ます。`,
    level: 'beginner',
    minutes: 3,
    tags: '日常,生活',
  },
  {
    title: '日本の四季',
    content: `日本には美しい四季があります。春には桜の花が咲き、公園や川沿いに多くの人が花見に集まります。この時期は、ピンクの花びらが風に舞い、日本中が明るい雰囲気に包まれます。

夏は暑く湿気が多いですが、祭りや花火大会が各地で開催されます。伝統的な浴衣を着て、屋台の食べ物を楽しむのが夏の醍醐味です。

秋になると、木々の葉が赤や黄色に色づき、紅葉狩りを楽しむ人々で山や公園が賑わいます。冬は地域によって雪が多く降り、温泉に入りながら雪景色を楽しむのは日本の冬ならではの体験です。`,
    level: 'elementary',
    minutes: 4,
    tags: '文化,自然,季節',
  },
  {
    title: '現代日本の働き方改革',
    content: `日本は長らく、長時間労働と厳格な職場階層で知られてきました。「過労死」という言葉が国際的に知られるほど、働きすぎの問題は深刻でした。しかし近年、日本政府と多くの企業は、この根深い労働文化を変えようと取り組んでいます。

働き方改革関連法の施行により、残業時間に上限が設けられ、有給休暇の取得が義務化されました。また、リモートワークやフレックスタイム制の導入が加速し、従業員が自分のペースで働ける環境が整いつつあります。

こうした変化は、特に若い世代に歓迎されています。仕事と生活のバランスを重視する価値観が広まり、企業は優秀な人材を確保するために、柔軟な働き方を提供することが求められるようになりました。`,
    level: 'intermediate',
    minutes: 5,
    tags: '社会,労働,文化',
  },
]

async function seed() {
  await client.connect()
  console.log('Connected to database')

  const { rows } = await client.query('SELECT COUNT(*) FROM vocabulary_words') as { rows: Array<{ count: string }> }
  if (Number(rows[0]!.count) > 0) {
    console.log('Seed data already exists, skipping.')
    await client.end()
    return
  }

  console.log('Seeding English vocabulary...')
  for (const w of enWords) {
    await client.query(
      `INSERT INTO vocabulary_words (id, word, reading, meaning, example_sentence, example_translation, language, level, tags, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'en', $6, '', NOW())`,
      [w.word, w.reading, w.meaning, w.example, w.translation, w.level],
    )
  }

  console.log('Seeding Japanese vocabulary...')
  for (const w of jaWords) {
    await client.query(
      `INSERT INTO vocabulary_words (id, word, reading, meaning, example_sentence, example_translation, language, level, tags, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ja', $6, '', NOW())`,
      [w.word, w.reading, w.meaning, w.example, w.translation, w.level],
    )
  }

  console.log('Seeding English documents...')
  for (const d of enDocuments) {
    await client.query(
      `INSERT INTO documents (id, title, content, language, level, estimated_reading_minutes, tags, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'en', $3, $4, $5, NOW())`,
      [d.title, d.content, d.level, d.minutes, d.tags],
    )
  }

  console.log('Seeding Japanese documents...')
  for (const d of jaDocuments) {
    await client.query(
      `INSERT INTO documents (id, title, content, language, level, estimated_reading_minutes, tags, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'ja', $3, $4, $5, NOW())`,
      [d.title, d.content, d.level, d.minutes, d.tags],
    )
  }

  await client.end()
  console.log('Seeding complete!')
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
