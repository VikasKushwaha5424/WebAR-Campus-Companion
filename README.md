# Maya — GITAM Smart Campus PWA

A progressive web app for campus navigation with an AI assistant (Maya). 2D map only — no AR/3D.

## Architecture

```
Frontend (React + Leaflet + Vite)      Backend (Python FastAPI)
┌─────────────────────────────┐       ┌──────────────────────────┐
│  CampusMap (Leaflet/OSM)    │──────▶│  POST /api/route         │
│  ChatOverlay (bottom sheet) │──────▶│  POST /generate (LLM)    │
│  HoldToTalk (Web Speech)    │──────▶│  POST /transcribe        │
│  FloorPlanView (SVG)        │       │  GET  /api/poi/list      │
│  SettingsPanel              │       │  GET  /locations         │
│  RoutePreview               │       │  POST /api/nearest       │
│  AdminDashboard (/admin)    │       │  data/nodes.json,poi.json│
└─────────────────────────────┘       └──────────────────────────┘
          ↕ GPS + SpeechSynthesis (all client-side)
```

## Quick Start

### Backend (port 8000)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# Add GROQ_API_KEY to backend/.env
python main.py
```

### Frontend (port 5173)
```bash
cd web-ui
npm install
npm run dev
```

### Admin Dashboard
Open `http://localhost:5173/admin` to add/edit campus nodes, edges, and POIs.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate` | LLM chat (returns `{text_response, route}`) |
| `POST` | `/api/route` | A* pathfinding (`{from, to}` → `{path, distance, steps}`) |
| `POST` | `/api/nearest` | Find nearest node by GPS (`{lat, lng}`) |
| `POST` | `/api/poi/search` | Search POIs by name/alias |
| `GET` | `/api/poi/list` | List all POI names |
| `POST` | `/transcribe` | Audio → text (faster-whisper, iOS fallback) |
| `GET` | `/locations` | Campus locations + nodes + POIs |
| `GET/POST/PUT/DELETE` | `/admin/*` | Admin CRUD for nodes/edges/POIs |

## Tech Stack

- **Frontend**: React 19, Leaflet + OpenStreetMap, Vite 8
- **Backend**: Python FastAPI, Uvicorn
- **LLM**: Groq API (Llama 3.1 8B) via OpenAI SDK
- **Pathfinding**: A* on campus graph (backend)
- **STT**: Browser SpeechRecognition API (primary), faster-whisper (fallback)
- **TTS**: Browser-native SpeechSynthesis
- **Data**: JSON files (`nodes.json`, `edges.json`, `poi.json`)
- **No WebSocket, No A-Frame, No Three.js**

## Adding Campus Data

1. Add nodes → `backend/data/nodes.json`
2. Add edges → `backend/data/edges.json`
3. Add POIs → `backend/data/poi.json`
4. Or use the Admin Dashboard at `/admin`
5. Restart backend — data reloads automatically

## Voice Support

- **Chrome/Edge**: Full support — SpeechRecognition (mic) + SpeechSynthesis (TTS)
- **Safari/Firefox**: Limited — backend Whisper STT fallback, SpeechSynthesis TTS
- **Mobile**: Hold-to-talk button + GPS auto-detect nearest building
