# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

영어 · 일본어 학습 플랫폼. Turborepo + pnpm 모노레포로 구성되며 세 개의 앱과 하나의 공유 패키지로 이루어진다.

- `apps/api` — NestJS + Fastify + TypeORM 백엔드 (포트 3001)
- `apps/web` — React 19 + Vite + TanStack Query/Router 프론트엔드 (포트 5173)
- `apps/whisper` — Python FastAPI + faster-whisper STT 마이크로서비스 (포트 8000)
- `packages/shared` — 세 앱이 공유하는 TypeScript 타입 정의

---

## 명령어

### 루트 (전체 앱 동시 실행)
```bash
pnpm dev          # API + Web 동시 실행
pnpm build        # 전체 빌드
pnpm type-check   # 전체 타입 체크
```

### 특정 앱만 실행
```bash
pnpm --filter @language-app/api dev
pnpm --filter @language-app/web dev
pnpm --filter @language-app/api type-check
pnpm --filter @language-app/web type-check
```

### shared 패키지 빌드 (타입 변경 후 필수)
```bash
pnpm --filter @language-app/shared exec tsc --build
```

> `packages/shared`의 타입을 수정하면 반드시 위 명령으로 빌드해야 다른 앱의 타입 체크가 통과된다. project references 방식을 사용하기 때문.

### 인프라 (로컬 개발)
```bash
docker compose up -d    # PostgreSQL 5432 + Redis 6379 실행
docker compose down     # 중지
```

### Whisper 서비스 (별도 터미널)
```bash
cd apps/whisper
.venv/Scripts/activate   # Windows
source .venv/bin/activate # macOS/Linux
uvicorn main:app --reload --port 8000
```

---

## 아키텍처

### AI 추상화 레이어

`packages/shared`의 `AIProvider` 인터페이스를 기준으로 구현체가 교체 가능하다.

```
AIProvider (interface, packages/shared/src/types/api.ts)
    └── OllamaProvider (apps/api/src/ai/providers/ollama.provider.ts)
         ↑ AiModule에서 주입
         ↑ AiService가 사용 (도메인별 프롬프트 조합)
```

새로운 AI 제공자(Claude API 등) 추가 시: `AIProvider`를 구현하는 클래스를 `providers/` 아래에 추가하고 `AiModule`의 provider를 교체하면 된다. `AiService`는 수정할 필요 없다.

### 회화 스트리밍 흐름

```
web: fetch POST /conversation/sessions/:id/messages
  → api: ConversationController (SSE, res.raw 직접 사용)
  → ConversationService.sendMessage() — AsyncIterable<string>
  → AiService.conversationStream()
  → OllamaProvider.stream() — Ollama /api/chat stream:true
```

컨트롤러에서 `@Res()`로 raw HTTP response를 직접 제어해 SSE를 구현한다. Fastify를 사용하므로 `res.raw`는 Node.js `http.ServerResponse`다.

### 음성 처리 흐름

```
web: MediaRecorder → audio/webm blob
  → transcribeAudio() (apps/web/src/lib/speech.ts)
  → POST /v1/speech/transcribe (NestJS)
  → SpeechService → HTTP multipart → Whisper FastAPI (포트 8000)
  → faster-whisper 로컬 모델 → 텍스트 반환
TTS: speak() → Web SpeechSynthesis API (브라우저 내장, 별도 서비스 없음)
```

### TypeORM 설정 주의사항

- `NODE_ENV=development`일 때 `synchronize: true` — 스키마 자동 동기화
- 프로덕션 전환 시 반드시 `synchronize: false`로 변경하고 마이그레이션 작성 필요
- 엔티티 파일명 패턴: `*.entity.ts`

### 프론트엔드 라우팅

`apps/web/src/routeTree.gen.ts`는 수동 관리 파일이다 (실제 프로젝트에서 TanStack Router CLI가 자동 생성하는 파일을 임시로 수동 작성한 것). 라우트 추가 시 이 파일에 직접 등록해야 한다.

### 인증

- 로그인 시 `accessToken`을 `localStorage`에 저장
- `apps/web/src/lib/api-client.ts`의 `request()`가 모든 요청에 Bearer 토큰 자동 첨부
- `apps/web/src/stores/auth.store.ts` (Zustand)가 클라이언트 인증 상태 관리

### TypeScript 설정

- `packages/shared`는 composite 빌드 (`tsconfig.json`의 `"composite": true`)
- `apps/api`와 `apps/web` 모두 `references`로 shared를 참조
- `exactOptionalPropertyTypes: true` 활성화 — `undefined`와 `null`을 구분해서 사용

### SM-2 스페이스드 리피티션

`apps/api/src/vocabulary/vocabulary.service.ts`의 `reviewWord()`에 구현. `quality` 파라미터는 0~5 정수값이며 3 미만이면 `repetitions`가 초기화된다.

---

## 환경 변수

`apps/api/.env.example` 참고. 주요 항목:

| 변수 | 설명 |
|---|---|
| `OLLAMA_MODEL` | 사용할 Ollama 모델명 (기본: `llama3.2`) |
| `OLLAMA_BASE_URL` | Ollama 서버 주소 |
| `WHISPER_BASE_URL` | Whisper FastAPI 서비스 주소 |
| `DB_*` | PostgreSQL 연결 정보 |
| `JWT_SECRET` | JWT 서명 키 |

Whisper 모델 크기는 `apps/whisper/main.py`의 `model_size` 변수로 변경한다 (`base` → `small` / `medium` / `large-v3`).
