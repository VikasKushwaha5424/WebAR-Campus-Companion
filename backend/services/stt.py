import os
import tempfile
import asyncio

from faster_whisper import WhisperModel

print("Loading Whisper model (first boot may take a moment)...")
stt_model = WhisperModel("small.en", device="cpu", compute_type="int8")
print("Whisper model loaded!")


async def transcribe_bytes(audio_bytes: bytes) -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            path = tmp.name

        def _run():
            segments, _ = stt_model.transcribe(
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
