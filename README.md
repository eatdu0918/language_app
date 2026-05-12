# LangApp

AI 기반 영어 · 일본어 학습 플랫폼. 로컬 LLM(Ollama)과 음성 인식(Whisper)을 활용해 단어 암기, 문서 읽기, 실시간 회화 연습을 제공합니다.

---

## 주요 기능

### 단어 (Vocabulary)
- SM-2 스페이스드 리피티션 알고리즘으로 복습 주기 자동 관리
- Ollama가 단어별 예문 · 뉘앙스 · 기억법 실시간 생성
- 플래시카드 UI + 6단계 품질 평가 (다시 / 어려움 / 애매 / 기억 / 쉬움 / 완벽)
- 발음 연습: 마이크 녹음 → Whisper STT → 발음 확인

### 문서 (Documents)
- 레벨별 원문 읽기 (beginner → advanced)
- Ollama가 같은 내용을 사용자 수준에 맞게 실시간 재작성
- 소리 내어 읽기: 녹음 → 텍스트 변환 후 원문과 비교
- TTS로 원어민 발음 청취

### 회화 (Conversation)
- Ollama와 실시간 음성 대화 (자유 / 인터뷰 / 쇼핑 / 레스토랑)
- 마이크 → Whisper STT → Ollama 응답 → TTS 자동 재생
- SSE 스트리밍으로 응답 지연 최소화
- 대화 종료 시 문법 오류 · 자연스러운 표현 분석 리포트

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 모노레포 | Turborepo + pnpm workspaces |
| 프론트엔드 | React 19 · Vite · TypeScript · TanStack Query · TanStack Router · Zustand |
| 백엔드 | NestJS · Fastify · TypeORM · PostgreSQL · Redis |
| AI | Ollama (로컬 LLM) — 추후 Claude API 전환 가능 |
| 음성 인식 | faster-whisper (Python FastAPI 마이크로서비스) |
| 음성 출력 | Web Speech Synthesis API |
| 인증 | JWT (access token) + bcrypt |
| 인프라 | Docker Compose (PostgreSQL 16 · Redis 7) |

---

## 프로젝트 구조

```
language_app/
├── apps/
│   ├── api/          # NestJS 백엔드 (포트 3001)
│   │   └── src/
│   │       ├── auth/           # JWT 인증
│   │       ├── users/          # 유저 관리
│   │       ├── vocabulary/     # 단어 + SRS
│   │       ├── documents/      # 문서 + AI 레벨 조정
│   │       ├── conversation/   # 회화 세션 + SSE 스트리밍
│   │       ├── ai/             # Ollama 추상화 레이어
│   │       └── speech/         # Whisper STT 연동
│   ├── web/          # React 프론트엔드 (포트 5173)
│   │   └── src/
│   │       ├── routes/         # 페이지 컴포넌트
│   │       ├── lib/            # API 클라이언트 · 음성 유틸
│   │       └── stores/         # Zustand 전역 상태
│   └── whisper/      # FastAPI STT 서비스 (포트 8000)
└── packages/
    └── shared/       # 공유 TypeScript 타입
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- pnpm 10+
- Python 3.10+
- Docker Desktop
- [Ollama](https://ollama.com)

### 1. 저장소 클론 & 의존성 설치

```bash
git clone https://github.com/eatdu0918/language_app.git
cd language_app
pnpm install
```

### 2. 데이터베이스 실행

```bash
docker compose up -d
```

### 3. Ollama 모델 설치 & 실행

```bash
ollama pull llama3.2
ollama serve
```

### 4. Whisper STT 서비스 실행

```bash
cd apps/whisper
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> 첫 실행 시 Whisper `base` 모델이 자동 다운로드됩니다 (~150MB).  
> 정확도가 필요하면 `main.py`의 `model_size`를 `small` 또는 `medium`으로 변경하세요.

### 5. 환경 변수 설정

```bash
cp apps/api/.env.example apps/api/.env
```

`.env` 주요 항목:

```env
OLLAMA_MODEL=llama3.2        # 사용할 Ollama 모델
OLLAMA_BASE_URL=http://localhost:11434
WHISPER_BASE_URL=http://localhost:8000
JWT_SECRET=your-secret-here
```

### 6. 앱 실행

```bash
pnpm dev   # API + Web 동시 실행
```

| 서비스 | URL |
|---|---|
| 웹 앱 | http://localhost:5173 |
| API 서버 | http://localhost:3001 |
| API 문서 (Swagger) | http://localhost:3001/docs |
| Whisper 서비스 | http://localhost:8000 |

---

## AI 추상화 레이어

Ollama와 Claude API를 동일한 인터페이스로 교체할 수 있도록 설계되었습니다.

```typescript
// packages/shared/src/types/api.ts
interface AIProvider {
  chat(messages: AIMessage[], options?: AIOptions): Promise<string>
  stream(messages: AIMessage[], options?: AIOptions): AsyncIterable<string>
}
```

현재 구현체: `OllamaProvider`  
Claude API 전환 시: `ClaudeProvider`를 추가하고 `AiModule`에서 교체하면 됩니다.

---

## API 엔드포인트

```
POST   /v1/auth/register          회원가입
POST   /v1/auth/login             로그인

GET    /v1/users/me               내 프로필

GET    /v1/vocabulary/due         오늘 복습할 단어 목록
POST   /v1/vocabulary/:id/review  단어 복습 결과 기록 (SM-2)
GET    /v1/vocabulary/:id/examples AI 예문 생성

GET    /v1/documents              문서 목록 (language, level 필터)
GET    /v1/documents/:id          문서 상세
POST   /v1/documents/:id/adapt    AI 레벨 재작성

POST   /v1/conversation/sessions          새 대화 세션 시작
GET    /v1/conversation/sessions/:id      세션 조회
POST   /v1/conversation/sessions/:id/messages  메시지 전송 (SSE 스트리밍)
POST   /v1/conversation/sessions/:id/end  대화 종료 + 분석

POST   /v1/speech/transcribe      음성 → 텍스트 변환
```

---

## 로드맵

- [ ] 구독 결제 (Stripe)
- [ ] 레벨 평가 시스템 (초기 진단 테스트)
- [ ] 단어장 시드 데이터 (JLPT N5~N1, TOEIC 기출)
- [ ] 학습 통계 대시보드 (주간 리포트, 연속 학습일)
- [ ] React Native 앱 (iOS / Android)
- [ ] Claude API 연동 (고급 분석 기능)
