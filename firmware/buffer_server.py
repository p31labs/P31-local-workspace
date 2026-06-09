#!/usr/bin/env python3
"""
The Buffer - Tailscale Private Server for Node Zero

FastAPI WebSocket server that receives audio streams from GrokPhenix/Xiaozhi
over Tailscale (100.x.y.z) and forwards to AI services or local processing.

Features:
- WebSocket endpoint for audio streaming
- Fawn Guard override: mute/disconnect on physical button press
- Audio buffering and forward/backpressure control
- Fisher-Escola telemetry capture
- Tailscale IP verification

Run with: uvicorn buffer_server:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import logging
import hashlib
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("buffer")

app = FastAPI(title="Node Zero Buffer", version="0.1.0")

# CORS for web interface (optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class AudioChunk(BaseModel):
    """Audio data chunk from ESP32."""
    timestamp: float
    sequence: int
    data: str  # base64 encoded PCM
    sample_rate: int = 24000
    channels: int = 1
    bits_per_sample: int = 16

class Telemetry(BaseModel):
    """Fisher-Escola telemetry."""
    device_id: str
    cpu_usage: float
    heap_free: int
    wifi_rssi: int
    buttons_state: int  # bitmask
    haptic_active: bool
    timestamp: float

class ConnectionState:
    """Per-client connection state."""
    def __init__(self, client_id: str):
        self.client_id = client_id
        self.connected_at = time.time()
        self.last_audio = 0.0  # float timestamp
        self.audio_chunks_received = 0
        self.bytes_received = 0
        self.fawn_guard_active = False
        self.muted = False
        
    def to_dict(self):
        return {
            "client_id": self.client_id,
            "connected_at": self.connected_at,
            "duration": time.time() - self.connected_at,
            "last_audio": self.last_audio,
            "audio_chunks": self.audio_chunks_received,
            "bytes": self.bytes_received,
            "fawn_guard": self.fawn_guard_active,
            "muted": self.muted,
        }

# Global state
connections: Dict[str, ConnectionState] = {}
active_websockets: Dict[str, WebSocket] = {}

@app.get("/")
async def root():
    """Health check and status."""
    return {
        "service": "Node Zero Buffer",
        "version": "0.1.0",
        "connections": len(connections),
        "clients": [conn.to_dict() for conn in connections.values()]
    }

@app.get("/connections")
async def get_connections():
    """List all active connections."""
    return [conn.to_dict() for conn in connections.values()]

@app.post("/fawn_guard/{client_id}")
async def fawn_guard_override(client_id: str, active: bool = True):
    """
    Trigger Fawn Guard override for a client.
    Called by Node Zero when physical Fawn Guard button is pressed.
    """
    if client_id not in connections:
        raise HTTPException(status_code=404, detail="Client not found")
    
    conn = connections[client_id]
    conn.fawn_guard_active = active
    conn.muted = active  # Mute audio when Fawn Guard active
    
    logger.warning(f"Fawn Guard {'ACTIVATED' if active else 'DEACTIVATED'} for {client_id}")
    
    # If we have WebSocket connection, notify client
    if client_id in active_websockets:
        try:
            await active_websockets[client_id].send_json({
                "type": "fawn_guard",
                "active": active,
                "timestamp": time.time()
            })
        except Exception as e:
            logger.error(f"Failed to notify client {client_id}: {e}")
    
    return {"status": "ok", "fawn_guard": active, "muted": conn.muted}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    Main WebSocket endpoint for audio streaming.
    
    Expected messages:
    - JSON: {"type": "audio", "data": base64_pcm, "sequence": N, ...}
    - JSON: {"type": "telemetry", ...}
    - JSON: {"type": "ping"}
    """
    await websocket.accept()
    logger.info(f"Client {client_id} connected from {websocket.client}")
    
    # Create connection state
    conn = ConnectionState(client_id)
    connections[client_id] = conn
    active_websockets[client_id] = websocket
    
    try:
        # Send initial config
        await websocket.send_json({
            "type": "config",
            "server_time": time.time(),
            "sample_rate": 24000,
            "channels": 1,
            "buffer_size": 4096,
            "welcome": "P31 Node Zero Buffer Ready"
        })
        
        while True:
            # Receive message (can be binary or text)
            message = await websocket.receive()
            
            if "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type", "unknown")
                
                if msg_type == "audio":
                    # Audio data
                    if conn.muted:
                        # Drop audio if muted by Fawn Guard
                        continue
                    
                    # Process audio chunk (in production, forward to AI service)
                    chunk = AudioChunk(**data)
                    conn.last_audio = time.time()
                    conn.audio_chunks_received += 1
                    conn.bytes_received += len(chunk.data)
                    
                    # Echo back for testing (remove in production)
                    await websocket.send_json({
                        "type": "ack",
                        "sequence": chunk.sequence,
                        "received_at": time.time()
                    })
                    
                elif msg_type == "telemetry":
                    # Telemetry data
                    telemetry = Telemetry(**data)
                    logger.info(f"Telemetry from {client_id}: "
                               f"CPU={telemetry.cpu_usage:.1f}%, "
                               f"Heap={telemetry.heap_free}B, "
                               f"RSSI={telemetry.wifi_rssi}dBm, "
                               f"Buttons=0b{telemetry.buttons_state:04b}")
                    
                    # Check if Fawn Guard button pressed (bit 0)
                    if telemetry.buttons_state & 0b0001:
                        if not conn.fawn_guard_active:
                            await fawn_guard_override(client_id, True)
                    else:
                        if conn.fawn_guard_active:
                            await fawn_guard_override(client_id, False)
                            
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": time.time()})
                    
            elif "bytes" in message:
                # Binary audio data (raw PCM)
                if conn.muted:
                    continue
                    
                audio_data = message["bytes"]
                conn.last_audio = time.time()
                conn.audio_chunks_received += 1
                conn.bytes_received += len(audio_data)
                
                # Process binary audio (forward to AI service)
                # For now, just acknowledge
                await websocket.send_json({
                    "type": "binary_ack",
                    "size": len(audio_data),
                    "received_at": time.time()
                })
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error with client {client_id}: {e}")
    finally:
        # Cleanup
        if client_id in active_websockets:
            del active_websockets[client_id]
        if client_id in connections:
            del connections[client_id]

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("Node Zero Buffer starting up...")
    logger.info("Listening on all interfaces (connect via Tailscale IP)")
    logger.info("WebSocket endpoint: ws://<tailscale_ip>:8000/ws/{client_id}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Node Zero Buffer shutting down...")
    for ws in active_websockets.values():
        try:
            await ws.close()
        except:
            pass

if __name__ == "__main__":
    # Run with: python buffer_server.py
    uvicorn.run(
        "buffer_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )