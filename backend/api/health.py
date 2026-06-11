from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Maya Campus API is running!", "version": "2.0", "status": "online"}
