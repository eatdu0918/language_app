-- 초기 단어 데이터 seed
-- 실행: docker exec -i <postgres_container> psql -U language_app -d language_app < apps/api/src/database/seed.sql

INSERT INTO vocabulary_words (id, word, reading, meaning, example_sentence, example_translation, language, level, tags, created_at)
VALUES
  -- 영어 beginner
  (gen_random_uuid(), 'apple',     NULL, '사과',   'I eat an apple every day.',            '나는 매일 사과를 먹는다.',     'en', 'beginner',    'fruit,food',    NOW()),
  (gen_random_uuid(), 'book',      NULL, '책',     'She reads a book before bed.',         '그녀는 자기 전에 책을 읽는다.', 'en', 'beginner',    'study,object',  NOW()),
  (gen_random_uuid(), 'water',     NULL, '물',     'Please drink more water.',             '물을 더 많이 마세요.',          'en', 'beginner',    'drink,health',  NOW()),
  (gen_random_uuid(), 'happy',     NULL, '행복한', 'I am happy to see you.',               '당신을 만나서 행복합니다.',     'en', 'beginner',    'emotion',       NOW()),
  (gen_random_uuid(), 'school',    NULL, '학교',   'I go to school every morning.',        '나는 매일 아침 학교에 간다.',   'en', 'beginner',    'education',     NOW()),
  (gen_random_uuid(), 'friend',    NULL, '친구',   'She is my best friend.',               '그녀는 나의 가장 친한 친구다.', 'en', 'beginner',    'relationship',  NOW()),
  (gen_random_uuid(), 'time',      NULL, '시간',   'What time is it now?',                 '지금 몇 시입니까?',            'en', 'beginner',    'daily',         NOW()),
  (gen_random_uuid(), 'money',     NULL, '돈',     'I do not have enough money.',          '나는 돈이 충분하지 않다.',      'en', 'beginner',    'finance',       NOW()),

  -- 영어 elementary
  (gen_random_uuid(), 'journey',   NULL, '여행, 여정',  'The journey took three hours.',           '여정은 세 시간이 걸렸다.',           'en', 'elementary',  'travel',        NOW()),
  (gen_random_uuid(), 'describe',  NULL, '묘사하다',    'Can you describe what happened?',         '무슨 일이 있었는지 묘사할 수 있나요?', 'en', 'elementary',  'communication', NOW()),
  (gen_random_uuid(), 'various',   NULL, '다양한',      'The store sells various products.',       '그 가게는 다양한 제품을 판다.',       'en', 'elementary',  'adjective',     NOW()),
  (gen_random_uuid(), 'although',  NULL, '~에도 불구하고', 'Although it rained, we went out.',    '비가 왔음에도 우리는 외출했다.',      'en', 'elementary',  'conjunction',   NOW()),
  (gen_random_uuid(), 'suggest',   NULL, '제안하다',    'I suggest we leave early.',               '나는 우리가 일찍 떠나길 제안한다.',   'en', 'elementary',  'communication', NOW()),

  -- 영어 intermediate
  (gen_random_uuid(), 'ambiguous', NULL, '모호한',      'The instructions were ambiguous.',        '지시사항이 모호했다.',              'en', 'intermediate','adjective',     NOW()),
  (gen_random_uuid(), 'persevere', NULL, '인내하다',    'You must persevere through difficulties.','어려움을 이겨내야 한다.',            'en', 'intermediate','verb',          NOW()),
  (gen_random_uuid(), 'eloquent',  NULL, '유창한, 웅변의', 'She gave an eloquent speech.',        '그녀는 유창한 연설을 했다.',         'en', 'intermediate','adjective',     NOW()),

  -- 일본어 beginner
  (gen_random_uuid(), '食べる',    'たべる',   '먹다',       '毎朝ごはんを食べる。',          '매일 아침 밥을 먹는다.',      'ja', 'beginner',    'verb,food',     NOW()),
  (gen_random_uuid(), '水',        'みず',     '물',         '水を飲んでください。',          '물을 마셔 주세요.',           'ja', 'beginner',    'noun,drink',    NOW()),
  (gen_random_uuid(), '学校',      'がっこう', '학교',       '毎日学校へ行きます。',          '매일 학교에 갑니다.',         'ja', 'beginner',    'noun,education',NOW()),
  (gen_random_uuid(), '友達',      'ともだち', '친구',       '彼女は私の親友です。',          '그녀는 나의 친한 친구입니다.', 'ja', 'beginner',    'noun,relationship', NOW()),
  (gen_random_uuid(), '大きい',    'おおきい', '큰',         'この犬はとても大きい。',        '이 개는 매우 크다.',          'ja', 'beginner',    'adjective',     NOW()),
  (gen_random_uuid(), '見る',      'みる',     '보다',       '映画を見るのが好きです。',      '영화 보는 것을 좋아합니다.',  'ja', 'beginner',    'verb',          NOW()),
  (gen_random_uuid(), '時間',      'じかん',   '시간',       '時間がありません。',            '시간이 없습니다.',            'ja', 'beginner',    'noun,daily',    NOW()),
  (gen_random_uuid(), '仕事',      'しごと',   '일, 직장',   '仕事は何ですか？',              '직업이 무엇입니까?',          'ja', 'beginner',    'noun,work',     NOW()),

  -- 일본어 elementary
  (gen_random_uuid(), '説明する',  'せつめいする', '설명하다', '詳しく説明してください。',   '자세히 설명해 주세요.',       'ja', 'elementary',  'verb,communication', NOW()),
  (gen_random_uuid(), '様々な',    'さまざまな', '다양한',    '様々な意見があります。',       '다양한 의견이 있습니다.',     'ja', 'elementary',  'adjective',     NOW()),
  (gen_random_uuid(), '経験',      'けいけん', '경험',       '貴重な経験を積みました。',      '소중한 경험을 쌓았습니다.',   'ja', 'elementary',  'noun',          NOW()),
  (gen_random_uuid(), '提案する',  'ていあんする', '제안하다', '新しい方法を提案します。',    '새로운 방법을 제안합니다.',   'ja', 'elementary',  'verb,communication', NOW()),

  -- 일본어 intermediate
  (gen_random_uuid(), '曖昧',      'あいまい', '모호함',     'その返事は曖昧だった。',        '그 대답은 모호했다.',         'ja', 'intermediate','noun,adjective', NOW()),
  (gen_random_uuid(), '忍耐',      'にんたい', '인내',       '忍耐が大切です。',              '인내가 중요합니다.',          'ja', 'intermediate','noun',          NOW())

ON CONFLICT DO NOTHING;
