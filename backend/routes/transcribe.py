from fastapi import APIRouter, UploadFile, File, Form

from services.stt import transcribe_bytes

router = APIRouter()


@router.post("/transcribe")
async def transcribe_upload(
    file: UploadFile = File(...),
    location: str = Form(""),
):
    audio_bytes = await file.read()
    transcript = await transcribe_bytes(audio_bytes)
    return {"transcript": transcript, "location": location, "filename": file.filename}
