import uuid

from fastapi import APIRouter

router = APIRouter()


@router.get("/init-session")
async def init_session():
    return {"session_id": str(uuid.uuid4())}
