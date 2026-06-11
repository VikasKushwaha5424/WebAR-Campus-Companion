import os, sys, asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import state
from state import clean_old_sessions

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise ValueError("GROQ_API_KEY is missing from the .env file!")

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

state.groq_client = AsyncOpenAI(
    api_key=API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(clean_old_sessions())
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN] if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import health, locations, transcribe, chat, session, routing, admin

app.include_router(health.router)
app.include_router(locations.router)
app.include_router(transcribe.router)
app.include_router(chat.router)
app.include_router(session.router)
app.include_router(routing.router)
app.include_router(admin.router)
