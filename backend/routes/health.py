from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "System Online: XR-NPC Backend running with HTTP & WebSockets!"}
