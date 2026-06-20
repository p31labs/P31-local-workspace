"""PHOS Forge event bus — native Python emission (no subprocess overhead)."""

import json
import socket
import uuid
import datetime
import os

EVENTS_PATH = '/tmp/phos-forge/events.jsonl'
SOCKET_PATH = '/tmp/phos-forge/bus.sock'


def bus_emit(event_type: str, payload: dict | str | None = None) -> None:
    event = {
        "type": event_type,
        "payload": payload or {},
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "id": str(uuid.uuid4()),
    }
    line = json.dumps(event, default=str) + "\n"

    # 1. Native file append (always works)
    try:
        os.makedirs(os.path.dirname(EVENTS_PATH), exist_ok=True)
        with open(EVENTS_PATH, "a") as f:
            f.write(line)
    except Exception:
        pass

    # 2. Native Unix socket broadcast (best-effort)
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        sock.connect(SOCKET_PATH)
        sock.sendall(line.encode("utf-8"))
        sock.close()
    except Exception:
        pass
