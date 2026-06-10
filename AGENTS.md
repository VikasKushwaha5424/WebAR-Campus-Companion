# Dev Workflow

## Physical Test with ngrok Tunnel

Run these 3 terminals in parallel:

```bash
# Terminal 1: Backend (FastAPI on port 8000)
cd backend
.\venv\Scripts\Activate
python app.py
```

```bash
# Terminal 2: Frontend (Vite on port 5173)
cd web-ui
npm run dev
```

```bash
# Terminal 3: ngrok tunnel (creates public HTTPS URL)
ngrok http 5173
```

Then open the `https://*.ngrok-free.app` URL on your phone **over cellular data** (not Gitam WiFi).

### Switching Between Modes

- **ngrok tunnel** (phone on cellular): `web-ui/.env.local` has `VITE_API_BASE=` (empty = relative paths through Vite proxy)
- **LAN testing** (phone on Gitam WiFi): Uncomment `VITE_API_BASE=http://YOUR_LAN_IP:8000` in `web-ui/.env.local`
- **Production**: `web-ui/.env.production` sets `VITE_API_BASE=https://maya-api.onrender.com`

### Vite Proxy Routes

All API routes proxied to `http://127.0.0.1:8000`:
- `/generate`, `/transcribe`, `/locations`, `/reset`, `/init-session`, `/announce`, `/ws` (WebSocket)
