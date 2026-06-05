import os
from typing import Optional
from google.genai import Client as GenaiClient

client: Optional[GenaiClient] = None
gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
