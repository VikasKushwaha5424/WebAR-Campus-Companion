# Dev Workflow

## Architecture Overview

```
Frontend (React + Leaflet + Vite)      Backend (Python FastAPI)
┌─────────────────────────────┐       ┌──────────────────────────┐
│  CampusMap (Leaflet/OSM)    │──────▶│  POST /api/route         │
│  ChatOverlay (bottom sheet) │──────▶│  POST /generate (LLM)    │
│  HoldToTalk (Web Speech)    │──────▶│  POST /transcribe        │
│  FloorPlanView (SVG)        │       │  GET  /api/poi/list      │
│  SettingsPanel              │       │  GET  /locations         │
│  RoutePreview               │       │  data/nodes.json,poi.json│
└─────────────────────────────┘       └──────────────────────────┘
          ↕ GPS + SpeechSynthesis (all client-side)
```

## Running Locally

### Terminal 1: Backend (FastAPI on port 8000)
```bash
cd backend
.\venv\Scripts\Activate
python app.py
```

### Terminal 2: Frontend (Vite on port 5173)
```bash
cd web-ui
npm run dev
```

### Terminal 3 (optional): ngrok tunnel for phone testing
```bash
ngrok http 5173
```

## Environment Config

- **ngrok tunnel** (phone on cellular): `web-ui/.env.local` has `VITE_API_BASE=` (empty = Vite proxy)
- **LAN testing** (phone on same WiFi): Uncomment `VITE_API_BASE=http://YOUR_LAN_IP:8000` in `web-ui/.env.local`
- **Production**: `web-ui/.env.production` sets `VITE_API_BASE=https://maya-api.onrender.com`

## Vite Proxy Routes

All API routes proxied to `http://127.0.0.1:8000`:
- `/generate` — Chat + LLM (returns JSON)
- `/transcribe` — Audio transcription
- `/locations` — Campus data
- `/reset` — Session reset
- `/init-session` — Session creation
- `/api/route` — Pathfinding
- `/api/poi/search` — POI lookup
- `/api/poi/list` — All POI names

## Key Design Decisions

- **No WebSocket**: Fully REST. Standard HTTP endpoints.
- **No A-Frame/Three.js**: 2D map only (Leaflet + OpenStreetMap).
- **TTS**: Browser-native `SpeechSynthesis` (no backend audio streaming).
- **STT**: Browser `SpeechRecognition` API (Chrome/Edge). Backend Whisper available as fallback.
- **Data**: JSON files (`nodes.json`, `edges.json`, `poi.json`) loaded at startup.
- **Pathfinding**: A* on backend. `POST /api/route` returns `{path, distance, steps}`.
- **LLM**: Groq API via OpenAI SDK. Returns JSON `{text_response, route}`.

## Adding New Campus Data

1. Add nodes to `backend/data/nodes.json` (id, label, type, lat, lng)
2. Add edges to `backend/data/edges.json` (source, target, distance, accessibility flags)
3. Add POI with aliases to `backend/data/poi.json` (name, aliases[], node_id, category)
4. Restart backend — data reloads automatically
