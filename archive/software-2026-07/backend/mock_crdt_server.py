#!/usr/bin/env python3
"""
Mock CRDT Server for P31 - Simple WebSocket server on port 8032
This provides a basic server to demonstrate CRDT functionality without complex dependencies.
"""

import asyncio
import json
import websockets
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s: %(message)s',
)
logger = logging.getLogger("p31.mock_crdt")

# Mock CRDT state
crdt_state = {
    "spoons": 12.0,
    "nodes": []
}

async def handle_client(websocket):
    """Handle a single WebSocket client connection."""
    logger.info(f"New client connected: {websocket.remote_address}")
    
    try:
        # Send initial state
        await websocket.send(json.dumps({
            "type": "state_update",
            "state": crdt_state
        }))
        
        # Handle incoming messages
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received: {data}")
                
                # Handle spoon updates
                if data.get("type") == "spoon_update":
                    new_spoons = data.get("spoons", 12.0)
                    crdt_state["spoons"] = new_spoons
                    logger.info(f"Updated spoons to: {new_spoons}")
                    
                    # Broadcast to all clients
                    await broadcast_state()
                
                # Handle node updates
                elif data.get("type") == "node_update":
                    node = data.get("node")
                    if node and node not in crdt_state["nodes"]:
                        crdt_state["nodes"].append(node)
                        logger.info(f"Added node: {node}")
                        await broadcast_state()
                        
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        logger.error(f"Error with client {websocket.remote_address}: {e}")

async def broadcast_state():
    """Broadcast current state to all connected clients."""
    # This is a simplified version - in a real implementation, 
    # you'd need to track connected clients
    pass

async def main():
    """Start the mock CRDT server."""
    server = await websockets.serve(
        handle_client,
        "localhost", 
        8032,
        ping_interval=None  # Disable pings for simplicity
    )
    
    logger.info("[P31 Mock CRDT] Synchronization Matrix Online on port 8032")
    logger.info("Note: This is a mock server for demonstration purposes")
    
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")