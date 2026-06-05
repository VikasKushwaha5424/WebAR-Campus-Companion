import json
import time
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types

import state
from npcs import NPC_PROMPTS, NPC_VOICES, session_memories, get_or_create_session
from services.stt import transcribe_base64
from services.tts import clean_text, stream_tts_pcm

router = APIRouter()


@router.websocket("/ws/npc/{npc_id}/{session_id}")
async def npc_websocket(websocket: WebSocket, npc_id: str, session_id: str):
    await websocket.accept()

    npc = npc_id.lower()
    if npc not in NPC_PROMPTS:
        await websocket.send_json({"type": "error", "message": "Invalid NPC ID"})
        await websocket.close()
        return

    history = get_or_create_session(session_id, npc)
    system_prompt = NPC_PROMPTS[npc]

    try:
        while True:
            data = await websocket.receive_json()
            session_memories[session_id]["last_active"] = time.time()

            event = data.get("event_type", "speech")
            payload = data.get("payload", "")
            world_state = json.dumps(data.get("world_state", {}))

            stt_ms = llm_ms = tts_ms = 0

            if event == "audio":
                t0 = time.time()
                user_text = await transcribe_base64(payload)
                stt_ms = (time.time() - t0) * 1000

                if not user_text:
                    await websocket.send_json({"type": "done"})
                    continue

                await websocket.send_json({"type": "user_transcript", "content": user_text})
                prompt = f"[System World State: {world_state}] User says: {user_text}"

            elif event == "gesture":
                prompt = f"[System World State: {world_state}] The user performed a gesture: {payload}"
            else:
                if isinstance(payload, str) and not payload.strip():
                    await websocket.send_json({"type": "done"})
                    continue
                prompt = f"[System World State: {world_state}] User says: {payload}"

            history.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

            t0 = time.time()
            response = await state.client.aio.models.generate_content(
                model=state.gemini_model,
                contents=history,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=300,
                    temperature=0.8,
                ),
            )
            llm_ms = (time.time() - t0) * 1000

            history.append(types.Content(role="model", parts=[types.Part.from_text(text=response.text)]))
            if len(history) > 10:
                del history[:-10]

            await websocket.send_json({"type": "text", "content": response.text})

            t0 = time.time()
            spoken = clean_text(response.text)
            voice = NPC_VOICES.get(npc, "en-US-AriaNeural")

            try:
                async for chunk in stream_tts_pcm(spoken, voice):
                    await websocket.send_json({
                        "type": "audio_chunk",
                        **chunk,
                    })
            except Exception as e:
                print(f"TTS stream error: {e}")
                traceback.print_exc()
                await websocket.send_json({"type": "error", "message": "Audio stream failed."})

            tts_ms = (time.time() - t0) * 1000
            print(f"[TIMING] STT: {stt_ms:.0f}ms | LLM: {llm_ms:.0f}ms | TTS: {tts_ms:.0f}ms")
            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected.")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if history and history[-1].role == "model":
            history.pop()
        if history and history[-1].role == "user":
            history.pop()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
