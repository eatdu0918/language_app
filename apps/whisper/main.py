import io
import time
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from pydantic import BaseModel


model: WhisperModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model_size = "base"  # small / medium / large-v3 로 교체 가능
    print(f"Loading Whisper model: {model_size}")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    print("Whisper model ready")
    yield
    model = None


app = FastAPI(title="Whisper STT Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscribeResponse(BaseModel):
    text: str
    language: str
    duration: float


SUPPORTED_LANGUAGES = {"en", "ja", "ko"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    file: Annotated[UploadFile, File()],
    language: Annotated[str | None, Form()] = None,
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if language and language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    audio_bytes = await file.read()
    audio_io = io.BytesIO(audio_bytes)

    start = time.time()
    segments, info = model.transcribe(
        audio_io,
        language=language,
        beam_size=5,
        vad_filter=True,           # 묵음 구간 자동 제거
        vad_parameters={"min_silence_duration_ms": 500},
    )

    text = " ".join(segment.text.strip() for segment in segments)
    duration = time.time() - start

    return TranscribeResponse(
        text=text,
        language=info.language,
        duration=round(duration, 2),
    )


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
