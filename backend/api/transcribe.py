import os, tempfile
from fastapi import APIRouter, UploadFile, File, Form
from faster_whisper import WhisperModel

router = APIRouter()

_model = None

def get_model():
    global _model
    if _model is None:
        try:
            _model = WhisperModel("small.en", device="cpu", compute_type="int8")
        except Exception as e:
            raise RuntimeError(f"Failed to load Whisper model: {e}")
    return _model

@router.post("/transcribe")
async def transcribe_upload(
    file: UploadFile = File(...),
    location: str = Form(""),
):
    audio_bytes = await file.read()
    ext = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"

    fd, path = tempfile.mkstemp(suffix=ext)
    try:
        written = 0
        while written < len(audio_bytes):
            written += os.write(fd, audio_bytes[written:])
        os.close(fd)

        model = get_model()
        from fastapi.concurrency import run_in_threadpool
        segments, info = await run_in_threadpool(model.transcribe, path, beam_size=5, language="en")

        text = " ".join(seg.text for seg in segments)

        return {
            "transcript": text.strip() or "[No speech detected]",
            "location": location,
            "filename": file.filename,
            "duration": round(info.duration, 1) if info else 0,
        }
    except Exception as e:
        return {
            "transcript": "[Error transcribing audio]",
            "location": location,
            "filename": file.filename,
            "error": str(e),
        }
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass
