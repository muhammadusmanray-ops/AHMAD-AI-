import os
import json
import asyncio
import threading
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import streamlit as st
import streamlit.components.v1 as components
import websockets

# --- FastAPI WebSocket Proxy Server ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

@app.websocket("/live-ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to FastAPI WebSocket")
    
    gemini_ws = None
    client_receive_task = None
    gemini_receive_task = None
    
    try:
        # First message must be setup
        init_data = await websocket.receive_text()
        msg = json.loads(init_data)
        
        if msg.get("type") == "start":
            voice = msg.get("voice", "Puck")
            system_instruction = msg.get("systemInstruction", "")
            
            # Connect to Gemini Live Multimodal API
            gemini_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={GEMINI_API_KEY}"
            gemini_ws = await websockets.connect(gemini_url)
            
            # Send setup frame
            setup_frame = {
                "setup": {
                    "model": "models/gemini-2.5-flash-native-audio-latest",
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {
                                    "voiceName": voice
                                }
                            }
                        }
                    },
                    "systemInstruction": {
                        "parts": [{"text": system_instruction}]
                    },
                    "tools": [
                        {
                            "functionDeclarations": [
                                {
                                    "name": "play_quran",
                                    "description": "Starts playing Quran surah recitation",
                                    "parameters": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "surah_number": {"type": "INTEGER", "description": "Surah number from 1 to 114"},
                                            "qari_name": {"type": "STRING", "description": "Optional reciter name"}
                                        },
                                        "required": ["surah_number"]
                                    }
                                },
                                {
                                    "name": "get_hadith",
                                    "description": "Fetches authentic Hadith reference",
                                    "parameters": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "book_name": {"type": "STRING", "description": "Book name like bukhari, muslim"},
                                            "hadith_number": {"type": "INTEGER", "description": "Hadith number"}
                                        },
                                        "required": ["book_name", "hadith_number"]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
            await gemini_ws.send(json.dumps(setup_frame))
            await websocket.send_json({"type": "status", "status": "connected"})
            
            async def relay_client_to_gemini():
                try:
                    async for client_msg in websocket.iter_text():
                        data = json.loads(client_msg)
                        if data.get("type") == "audio" and data.get("audio"):
                            # Relay PCM audio chunk to Gemini
                            payload = {
                                "realtimeInput": {
                                    "mediaChunks": [{
                                        "mimeType": "audio/pcm;rate=16000",
                                        "data": data["audio"]
                                    }]
                                }
                            }
                            await gemini_ws.send(json.dumps(payload))
                except Exception as e:
                    print(f"Error in client relay: {e}")

            async def relay_gemini_to_client():
                try:
                    async for gemini_msg in gemini_ws:
                        msg_data = json.loads(gemini_msg)
                        server_content = msg_data.get("serverContent")
                        
                        # Relay audio / text responses
                        if server_content:
                            model_turn = server_content.get("modelTurn")
                            if model_turn:
                                for part in model_turn.get("parts", []):
                                    inline_data = part.get("inlineData")
                                    if inline_data and inline_data.get("data"):
                                        await websocket.send_json({
                                            "type": "audio",
                                            "audio": inline_data["data"]
                                        })
                                    if part.get("text"):
                                        await websocket.send_json({
                                            "type": "assistant_text",
                                            "text": part["text"]
                                        })
                            
                            if server_content.get("turnComplete"):
                                await websocket.send_json({"type": "turn_complete"})
                            if server_content.get("interrupted"):
                                await websocket.send_json({"type": "interrupted"})
                        
                        # Relay tool calls
                        if msg_data.get("toolCall") and msg_data["toolCall"].get("functionCalls"):
                            for call in msg_data["toolCall"]["functionCalls"]:
                                await websocket.send_json({
                                    "type": "tool_call",
                                    "name": call["name"],
                                    "args": call.get("args", {}),
                                    "id": call.get("id")
                                })
                except Exception as e:
                    print(f"Error in Gemini relay: {e}")

            # Run relays concurrently
            client_receive_task = asyncio.create_task(relay_client_to_gemini())
            gemini_receive_task = asyncio.create_task(relay_gemini_to_client())
            await asyncio.gather(client_receive_task, gemini_receive_task)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if client_receive_task:
            client_receive_task.cancel()
        if gemini_receive_task:
            gemini_receive_task.cancel()
        if gemini_ws:
            await gemini_ws.close()
        print("Cleanup complete")

def run_fastapi():
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

# Start FastAPI in a background thread
threading.Thread(target=run_fastapi, daemon=True).start()


# --- Streamlit UI Wrapper ---
st.set_page_config(
    page_title="Ahmed AI - Islamic Voice Assistant",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding: 0rem !important;
        margin: 0rem !important;
        max-width: 100% !important;
    }
</style>
""", unsafe_allow_html=True)

# Embed custom static React frontend
components.html("""
<iframe 
    src="https://ahmad-ai-ivory.vercel.app" 
    style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"
    allow="microphone; camera; autoplay; clipboard-write; encrypted-media; speaker; display-capture"
    allowfullscreen>
</iframe>
""", height=950, scrolling=False)
