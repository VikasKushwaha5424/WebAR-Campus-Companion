# Maya — GITAM Smart Campus PWA

A progressive web app for campus navigation with an AI assistant (Maya). 2D Mapbox map — no AR/3D.

## Architecture

```
Frontend (React + Mapbox + Vite)      Backend (Python FastAPI)
┌─────────────────────────────┐       ┌──────────────────────────┐
│  CampusMap (Mapbox GL JS)   │──────▶│  POST /api/route         │
│  ChatOverlay (subtitle)     │──────▶│  POST /generate (LLM)    │
│  HoldToTalk (Web Speech)    │──────▶│  POST /transcribe        │
│  ETAOverlay (HUD card)      │       │  GET  /api/poi/list      │
│  SettingsPanel              │       │  GET  /locations         │
│  FloorPlanView (SVG)        │       │  POST /api/nearest       │
│  RoutePanel (A→B planner)   │       │  data/map.geojson        │
│  AdminDashboard (/admin)    │       │  verify_graph.py         │
└─────────────────────────────┘       └──────────────────────────┘
          ↕ GPS + Compass + SpeechSynthesis (all client-side)
```

## Features

- **Mapbox satellite map** with zoom-dependent POI/location labels (labels fade in at zoom ≥ 16.5)
- **A* pathfinding** on a campus road graph (backend) with offline JS fallback
- **Route snapping** — GPS marker snaps to the nearest route segment during navigation
- **Smooth GPS interpolation** — marker glides between positions (1s ease-out)
- **Compass heading arrow** — phone orientation rotates an arrow on the GPS marker
- **"You Have Arrived"** — auto-cancels route within 10m of destination, plays a chime
- **Humanized ETA** — displays "~5 min walk (450m)" with adaptive walking speed
- **Accessibility filters** — avoid stairs, wheelchair-only routes, no keycard areas
- **GPS jitter protection** — requires 3 consecutive off-route readings (≥15m) before recalculating
- **LLM chat** — Maya answers campus questions and generates routes via Groq API
- **Voice input** — Web Speech Recognition (Chrome/Edge) with faster-whisper fallback
- **TTS output** — browser-native SpeechSynthesis on sentence boundaries
- **Floor plan SVGs** — indoor maps for CSE Dept, Library, Admin Block
- **Admin dashboard** — CRUD for nodes, edges, and POIs at `/admin`

## Quick Start

### Backend (port 8000)
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
# Add GROQ_API_KEY to backend/.env
python app.py
```

### Frontend (port 5173)
```bash
cd web-ui
npm install
# Add VITE_MAPBOX_TOKEN to web-ui/.env.local
npm run dev
```

### Admin Dashboard
Open `http://localhost:5173/admin` to add/edit campus nodes, edges, and POIs.

### Graph Health Check
```bash
cd backend
python verify_graph.py
```
Scans the road graph for isolated nodes (0 edges) and dead ends (1 edge).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate` | LLM chat (streaming SSE, returns `{text, route}`) |
| `POST` | `/api/route` | A* pathfinding (`{from, to}` → `{path, distance, steps}`) |
| `POST` | `/api/nearest` | Find nearest node by GPS (`{lat, lng}`) |
| `POST` | `/api/poi/search` | Search POIs by name/alias |
| `GET` | `/api/poi/list` | List all POI names |
| `POST` | `/transcribe` | Audio → text (faster-whisper) |
| `GET` | `/locations` | Campus locations + nodes + POIs |
| `GET` | `/api/graph` | Full graph data (nodes + adjacency) for offline caching |
| `GET` | `/api/version` | Map data MD5 hash (triggers cache invalidation) |
| `GET/POST/PUT/DELETE` | `/admin/*` | Admin CRUD for nodes/edges/POIs |

## Tech Stack

- **Frontend**: React 19, Mapbox GL JS (satellite-v9), Vite
- **Backend**: Python FastAPI, Uvicorn, TinyDB
- **LLM**: Groq API (Llama 3.3 70B) via OpenAI SDK
- **Pathfinding**: A* on campus graph (backend) + offline JS fallback
- **STT**: Browser SpeechRecognition API (primary), faster-whisper (fallback)
- **TTS**: Browser-native SpeechSynthesis
- **Data**: Single `data/map.geojson` file (roads + POIs)
- **No WebSocket, No A-Frame, No Three.js**

## Adding Campus Data

1. Edit `backend/data/map.geojson` — add LineString roads, Point/Polygon POIs
2. Run `python verify_graph.py` to check for broken links
3. Restart backend — data reloads automatically
4. Or use the Admin Dashboard at `/admin`

## Voice Support

- **Chrome/Edge**: Full support — SpeechRecognition (mic) + SpeechSynthesis (TTS)
- **Safari/Firefox**: Limited — backend Whisper STT fallback, SpeechSynthesis TTS
- **Mobile**: Hold-to-talk button + GPS auto-detect nearest building + compass heading

## Environment Variables

### Backend (`backend/.env`)
- `GROQ_API_KEY` — required for LLM chat
- `MAYA_API_TOKEN` — optional, defaults to `maya_secret_token`
- `CORS_ORIGIN` — optional, defaults to `*`

### Frontend (`web-ui/.env.local`)
- `VITE_MAPBOX_TOKEN` — required for Mapbox GL JS
- `VITE_API_BASE` — optional, empty = Vite proxy to localhost:8000
- `VITE_API_KEY` — optional, matches MAYA_API_TOKEN on backend
