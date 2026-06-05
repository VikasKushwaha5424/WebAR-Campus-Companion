import os
import asyncio
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai

import state
from npcs import load_npcs, clean_old_sessions

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from the .env file!")

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

state.client = genai.Client(api_key=API_KEY)

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

load_npcs()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN] if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-NPC-Response"],
)

from routes import health, locations, transcribe, chat, ws

app.include_router(health.router)
app.include_router(locations.router)
app.include_router(transcribe.router)
app.include_router(chat.router)
app.include_router(ws.router)


@app.on_event("startup")
async def startup():
    asyncio.create_task(clean_old_sessions())
