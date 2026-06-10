import urllib.parse

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from npcs import NPC_VOICES
from services.tts import clean_text, stream_tts

router = APIRouter()


class AnnounceInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    voice: str = "en-US-AriaNeural"


@router.post("/announce")
async def announce(announcement: AnnounceInput):
    spoken = clean_text(announcement.text)
    voice = announcement.voice if announcement.voice in NPC_VOICES.values() else announcement.voice

    async def _stream():
        try:
            async for chunk in stream_tts(spoken, voice):
                yield chunk
        except Exception as e:
            print(f"Announce TTS error: {e}")

    encoded = urllib.parse.quote(spoken[:500])
    return StreamingResponse(
        _stream(),
        media_type="audio/mpeg",
        headers={"X-NPC-Response": encoded},
    )
