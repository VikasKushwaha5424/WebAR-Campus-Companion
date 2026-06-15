# Dev Workflow

## Architecture Overview

```
Frontend (React + Mapbox + Vite)      Backend (Python FastAPI)
┌─────────────────────────────┐       ┌──────────────────────────┐
│  CampusMap (Mapbox GL JS)   │──────▶│  POST /api/route         │
│  ChatOverlay (subtitle)     │──────▶│  POST /generate (LLM)    │
│  HoldToTalk (Web Speech)    │──────▶│  POST /transcribe        │
│  ETAOverlay (HUD card)      │       │  GET  /api/poi/list      │
│  SettingsPanel              │       │  GET  /locations         │
│  RoutePanel (A→B planner)   │       │  POST /api/nearest       │
│  FloorPlanView (SVG)        │       │  data/map.geojson        │
└─────────────────────────────┘       └──────────────────────────┘
          ↕ GPS + Compass + SpeechSynthesis (all client-side)
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/engine/graph.py` | Builds graph from `map.geojson`, adjacency, zones |
| `backend/engine/pathfinding.py` | A* pathfinder + GPS snapping pathfinder |
| `backend/engine/snapping.py` | Perpendicular projection onto road segments |
| `backend/engine/poi_search.py` | POI lookup by name/alias with fuzzy matching |
| `backend/api/routing.py` | `POST /api/route` endpoint |
| `backend/api/chat.py` | `POST /generate` — LLM streaming with route tool |
| `backend/verify_graph.py` | Graph health-check script |
| `web-ui/src/App.jsx` | Main app state, routing, chat |
| `web-ui/src/components/CampusMap.jsx` | Mapbox map, markers, route, labels |
| `web-ui/src/hooks/useRouteRecalculation.jsx` | Off-route detection (debounced) |

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
- `/generate` — Chat + LLM (SSE stream)
- `/transcribe` — Audio transcription
- `/locations` — Campus data
- `/reset` — Session reset
- `/init-session` — Session creation
- `/api/*` — Routing, POI search, graph, nearest, version

## Key Design Decisions

- **No WebSocket**: Fully REST with SSE for LLM streaming.
- **Mapbox**: `satellite-v9` style (not Leaflet/OSM).
- **TTS**: Browser-native `SpeechSynthesis` (no backend audio streaming).
- **STT**: Browser `SpeechRecognition` API (Chrome/Edge). Backend Whisper available as fallback.
- **Data**: Single `data/map.geojson` file (roads + POIs), loaded at startup.
- **Graph cache**: Thread-safe with `threading.Lock`, cached in module globals.
- **Pathfinding**: A* on backend. `POST /api/route` returns `{path, distance, steps, snapped_start, start_heading}`.
- **LLM**: Groq API (Llama 3.3 70B) via OpenAI SDK. SSE streaming with `find_route` tool.

## Notable Bug Fixes

- **GPS jitter**: Recalculation hook refs GPS coords + route — interval doesn't restart on every GPS tick.
- **Duplicate "Auto Detect"**: `campusLocations` initialized as `[]`, one entry prepended on load.
- **`.at(-1)` crash**: Replaced with `array[array.length - 1]` for browser compatibility.
- **Synthetic waypoint IDs**: `wp_*` IDs from LLM filtered out from `active_route` before sending.
- **Geolocation permission**: GPS denied state now shown as UI banner.
- **Toast timer**: `toastTimerRef` tracks timeout for cleanup.
- **Empty `from_node`**: Sent as `null` instead of `''` to backend.
- **Haversine NaN**: `Math.max(0, a)` guards in all distance calculations.
- **fitBounds after recalc**: Destination ID includes route length to force re-fit.
- **ErrorBoundary**: Wraps `StrictMode` (outermost) to catch render errors.

## Adding New Campus Data

1. Edit `backend/data/map.geojson` — add LineString roads with `isStairs`, `hasRamp`, `requiresKeycard`, `level` properties
2. Add POI features as Point or Polygon geometry with `name` and `category` properties
3. Run `python verify_graph.py` to check for isolated nodes or dead ends
4. Restart backend — data reloads automatically
