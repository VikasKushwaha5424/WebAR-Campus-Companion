# XR-NPC-Project

**WebAR Campus Companion** — an AR-powered campus navigation guide with AI NPCs.

## Structure

```
├── backend/       # Python FastAPI server (STT + LLM + TTS)
│   ├── app.py         # FastAPI app creation
│   ├── main.py        # Entry point
│   ├── models.py      # Pydantic schemas
│   ├── npcs.py        # NPC personality & session management
│   ├── state.py       # Shared app state
│   ├── services/      # STT (Whisper) & TTS (Edge-TTS)
│   ├── routes/        # HTTP + WebSocket endpoints
│   └── requirements.txt
├── web-ui/        # React + Vite + A-Frame frontend
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks
│       ├── data/        # Shared config/constants
│       └── App.jsx
└── docs/          # Documentation
```

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Add GROQ_API_KEY to backend/.env
python main.py

# Frontend
cd web-ui
npm install
npm run dev
```

## Testing on Mobile (AR Mode)

### 1. Camera requires HTTPS
Mobile browsers block `navigator.mediaDevices` on insecure HTTP (except localhost).  
To test AR on your phone from your dev machine, use **ngrok**:

```bash
# Install ngrok from https://ngrok.com
ngrok http 5173
# Open the https://xxxx.ngrok-free.app URL on your phone
```

### 2. Backend must be reachable from phone
The frontend `API_BASE` defaults to the same origin. When testing with ngrok or a deployed frontend, point it to your backend:

```bash
# On Windows (PowerShell):
$env:VITE_API_BASE="http://192.168.x.x:8000"
npm run dev

# Or create web-ui/.env.local with:
VITE_API_BASE=http://192.168.x.x:8000
```

### 3. iOS audio format
Safari records audio as `.mp4` instead of `.webm`. The app detects the MIME type automatically — no manual fix needed.

## Deployment (Render)

The backend is configured for Render via `render.yaml`.  
`build.sh` installs system-level `ffmpeg` (required by TTS) before pip installs Python packages.
