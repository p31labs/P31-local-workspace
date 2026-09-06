// ── Config ──────────────────────────────────────────────────────────────────
const SIGNALING_BASE = "wss://p31-signaling.trimtab-signal.workers.dev";
const STUN_SERVERS = [{ urls: "stun:stun.cloudflare.com:3478" }];

// ── State ────────────────────────────────────────────────────────────────────
let myId = null;
let myRoomId = null;
let sigWs = null;
let peerConns = new Map();
let dataChannels = new Map();
let breathInterval = null;
let breathActive = false;
let sigReconnectTimer = null;

// ── Logging ────────────────────────────────────────────────────────────────────
function log(msg, cls = "sys") {
  const el = document.getElementById("log");
  const t = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  el.innerHTML += `<div class="${cls}">[${t}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

// ── ID / Room generation ─────────────────────────────────────────────────────
function genId() {
  const buf = new Uint8Array(3);
  crypto.getRandomValues(buf);
  return "p31-" + Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 6);
}

// ── Signaling WebSocket ──────────────────────────────────────────────────────
function connectSignaling(roomId, peerId) {
  if (sigWs) {
    sigWs.onclose = null;
    sigWs.close();
  }

  const url = `${SIGNALING_BASE}/signal/${roomId}?peerId=${encodeURIComponent(peerId)}`;
  log("Connecting to signaling room: " + roomId, "sys");
  setStatus("init", "Connecting to signaling...");

  sigWs = new WebSocket(url);

  sigWs.onopen = () => {
    clearTimeout(sigReconnectTimer);
    setStatus("on", "Online — waiting for peer");
    document.getElementById("btnConnect").disabled = false;
    log("Signaling connected. Node: " + myId);
  };

  sigWs.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleSignalingMsg(msg);
  };

  sigWs.onclose = (e) => {
    log("Signaling closed (code " + e.code + ") — reconnecting in 3s", "err");
    setStatus("init", "Reconnecting...");
    document.getElementById("btnConnect").disabled = true;
    sigReconnectTimer = setTimeout(() => connectSignaling(roomId, peerId), 3000);
  };

  sigWs.onerror = () => {
    log("Signaling error", "err");
  };
}

function sendSignal(msg) {
  if (sigWs && sigWs.readyState === WebSocket.OPEN) {
    sigWs.send(JSON.stringify(msg));
  }
}

// ── Signaling message dispatch ───────────────────────────────────────────────
async function handleSignalingMsg(msg) {
  const { type, from } = msg;

  if (type === "peer-joined") {
    log("Peer joined room (" + msg.peerCount + " total)", "rx");
    if (from && from !== myId && !peerConns.has(from)) {
      await initiateOffer(from);
    }
    return;
  }

  if (type === "peer-left") {
    log("Peer left: " + (from || msg.peerId), "err");
    const leaveId = from || msg.peerId;
    closePeer(leaveId);
    return;
  }

  if (!from || from === myId) return;

  if (type === "offer") {
    await handleOffer(from, msg.sdp);
  } else if (type === "answer") {
    await handleAnswer(from, msg.sdp);
  } else if (type === "candidate") {
    await handleCandidate(from, msg.candidate);
  } else if (type === "hello") {
    log("Handshake from " + from, "rx");
  } else if (type === "breath") {
    onRemoteBreath(msg);
  } else if (type === "bye") {
    closePeer(from);
  }
}

// ── RTCPeerConnection factory ─────────────────────────────────────────────────
function createPeerConn(remotePeerId) {
  if (peerConns.has(remotePeerId)) return peerConns.get(remotePeerId);

  const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
  peerConns.set(remotePeerId, pc);

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      sendSignal({ type: "candidate", to: remotePeerId, candidate: e.candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    log("ICE " + remotePeerId.slice(0, 10) + "… → " + pc.iceConnectionState, "sys");
    if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
      closePeer(remotePeerId);
    }
  };

  pc.ondatachannel = (e) => {
    setupDataChannel(remotePeerId, e.channel);
  };

  return pc;
}

// ── Offer/Answer flow ─────────────────────────────────────────────────────────
async function initiateOffer(remotePeerId) {
  log("Initiating offer to " + remotePeerId, "tx");
  const pc = createPeerConn(remotePeerId);
  const dc = pc.createDataChannel("p31-mesh", { ordered: true });
  setupDataChannel(remotePeerId, dc);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendSignal({ type: "offer", to: remotePeerId, sdp: pc.localDescription });
}

async function handleOffer(remotePeerId, sdp) {
  log("Offer from " + remotePeerId, "rx");
  const pc = createPeerConn(remotePeerId);
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendSignal({ type: "answer", to: remotePeerId, sdp: pc.localDescription });
}

async function handleAnswer(remotePeerId, sdp) {
  log("Answer from " + remotePeerId, "rx");
  const pc = peerConns.get(remotePeerId);
  if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

async function handleCandidate(remotePeerId, candidate) {
  const pc = peerConns.get(remotePeerId);
  if (pc && candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      /* ignore */
    }
  }
}

// ── Data channel setup ────────────────────────────────────────────────────────
function setupDataChannel(remotePeerId, dc) {
  dataChannels.set(remotePeerId, dc);

  dc.onopen = () => {
    updatePeerCount();
    setStatus("on", `Linked — ${dataChannels.size} peer(s)`);
    log("Linked to " + remotePeerId, "rx");
    document.getElementById("breathCard").style.display = "block";
    dcSend(remotePeerId, { type: "hello", from: myId, ts: Date.now() });
  };

  dc.onmessage = (e) => {
    let data;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }
    if (data.type === "breath") {
      onRemoteBreath(data);
    } else if (data.type === "hello") {
      log("Handshake from " + (data.from || remotePeerId), "rx");
    } else if (data.type === "ping") {
      log("Ping received", "rx");
      vibrate([80, 40, 80]);
    }
  };

  dc.onclose = () => {
    closePeer(remotePeerId);
  };

  dc.onerror = (err) => {
    log("DataChannel error: " + err, "err");
  };
}

function dcSend(peerId, data) {
  const dc = dataChannels.get(peerId);
  if (dc && dc.readyState === "open") {
    dc.send(JSON.stringify(data));
  }
}

function closePeer(peerId) {
  const dc = dataChannels.get(peerId);
  if (dc) {
    try {
      dc.close();
    } catch {
      /* ignore */
    }
    dataChannels.delete(peerId);
  }
  const pc = peerConns.get(peerId);
  if (pc) {
    try {
      pc.close();
    } catch {
      /* ignore */
    }
    peerConns.delete(peerId);
  }
  updatePeerCount();
  log("Peer disconnected: " + peerId, "err");
  if (dataChannels.size === 0) {
    setStatus("on", "Online — waiting for peer");
    document.getElementById("breathCard").style.display = "none";
  }
}

// ── Broadcast to all data channels ───────────────────────────────────────────
function broadcast(data) {
  for (const [peerId] of dataChannels) {
    dcSend(peerId, data);
  }
  if (data.type === "breath") sendSignal({ ...data, from: myId });
}

// ── Connect (manual — enter remote peer ID and join their room) ───────────────
function connect() {
  const remoteId = document.getElementById("remoteId").value.trim();
  if (!remoteId) return;

  const targetRoom = remoteId;
  log("Joining room of " + remoteId + "...", "tx");

  connectSignaling(targetRoom, myId);

  pendingConnectTarget = remoteId;
}

let pendingConnectTarget = null;

// ── Breathing Engine ──────────────────────────────────────────────────────────
const INHALE = 4000;
const HOLD = 4000;
const EXHALE = 6000;
const CYCLE = INHALE + HOLD + EXHALE;

function startBreath() {
  if (breathActive) {
    stopBreath();
    return;
  }
  breathActive = true;
  document.getElementById("btnPulse").textContent = "STOP SYNC";
  log("Breath sync started (4-4-6)", "tx");

  const startTime = Date.now();

  function tick() {
    const elapsed = (Date.now() - startTime) % CYCLE;
    const ring = document.getElementById("breathRing");
    const label = document.getElementById("breathLabel");
    const timer = document.getElementById("breathTimer");

    if (elapsed < INHALE) {
      const secs = Math.ceil((INHALE - elapsed) / 1000);
      ring.className = "breath-ring inhale";
      label.textContent = "INHALE";
      timer.textContent = secs;
    } else if (elapsed < INHALE + HOLD) {
      const secs = Math.ceil((INHALE + HOLD - elapsed) / 1000);
      ring.className = "breath-ring hold";
      label.textContent = "HOLD";
      timer.textContent = secs;
    } else {
      const secs = Math.ceil((CYCLE - elapsed) / 1000);
      ring.className = "breath-ring exhale";
      label.textContent = "EXHALE";
      timer.textContent = secs;

      if (elapsed - (INHALE + HOLD) < 120) {
        vibrate([100, 50, 100]);
        broadcast({ type: "breath", phase: "exhale", ts: Date.now() });
      }
    }
  }

  tick();
  breathInterval = setInterval(tick, 100);
}

function stopBreath() {
  breathActive = false;
  clearInterval(breathInterval);
  breathInterval = null;
  document.getElementById("btnPulse").textContent = "START SYNC";
  document.getElementById("breathRing").className = "breath-ring";
  document.getElementById("breathLabel").textContent = "READY";
  document.getElementById("breathTimer").textContent = "—";
  log("Breath sync stopped", "sys");
}

function onRemoteBreath(data) {
  if (data.phase === "exhale") {
    vibrate([60, 30, 60]);
    log("Remote exhale received", "rx");
    const ring = document.getElementById("breathRing");
    ring.style.boxShadow = "0 0 30px rgba(34,197,94,0.5)";
    setTimeout(() => {
      ring.style.boxShadow = "none";
    }, 500);
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function setStatus(state, text) {
  const dot = document.getElementById("statusDot");
  dot.className = "dot dot-" + state;
  document.getElementById("statusText").textContent = text;
}

function updatePeerCount() {
  const el = document.getElementById("peerCount");
  const n = dataChannels.size;
  el.textContent = n > 0 ? `${n} peer${n > 1 ? "s" : ""} connected` : "";
}

document.getElementById("myId").addEventListener("click", () => {
  if (myId) {
    navigator.clipboard.writeText(myId).then(() => {
      log("ID copied to clipboard", "sys");
      const el = document.getElementById("myId");
      const orig = el.textContent;
      el.textContent = "COPIED";
      setTimeout(() => {
        el.textContent = orig;
      }, 1000);
    });
  }
});

document.getElementById("remoteId").addEventListener("keydown", (e) => {
  if (e.key === "Enter") connect();
});

(function init() {
  myId = genId();
  myRoomId = myId;
  document.getElementById("myId").textContent = myId;
  setStatus("init", "Connecting to signaling...");
  connectSignaling(myRoomId, myId);
})();
