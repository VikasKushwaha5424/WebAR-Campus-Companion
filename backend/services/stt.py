import os
import tempfile
import asyncio
import time

from faster_whisper import WhisperModel

_stt_model = None
_stt_lock = asyncio.Lock()


async def get_model():
    global _stt_model
    if _stt_model is not None:
        return _stt_model
    async with _stt_lock:
        if _stt_model is not None:
            return _stt_model
        device = os.getenv("STT_DEVICE", "cpu")
        print(f"[STT] Loading Whisper model (device={device})...")
        t0 = time.time()
        _stt_model = await asyncio.to_thread(
            WhisperModel, "small.en", device=device, compute_type="int8"
        )
        print(f"[STT] Whisper model loaded in {time.time() - t0:.1f}s")
    return _stt_model


async def transcribe_bytes(audio_bytes: bytes) -> str:
    try:
        model = await get_model()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            path = tmp.name

        def _run():
            segments, _ = model.transcribe(
                path, beam_size=1, language="en", vad_filter=True
            )
            return "".join(s.text for s in segments)

        text = await asyncio.to_thread(_run)
        os.remove(path)
        return text.strip()
    except Exception as e:
        print(f"STT error: {e}")
        return "[Error transcribing audio]"


async def transcribe_base64(b64_audio: str) -> str:
    import base64
    try:
        data = base64.b64decode(b64_audio)
        return await transcribe_bytes(data)
    except Exception as e:
        print(f"STT decode error: {e}")
        return "[Error transcribing audio]"
