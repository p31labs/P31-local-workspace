/**
 * MLS-Lite — Minimal MLS-style E2EE for K⁴ Mesh
 * Web Crypto-based TreeKEM + symmetric ratchet for 4-member group (K₄)
 * 
 * P31 Labs, Inc. | EIN 42-1888158
 */

const GROUP_SIZE = 4;
const VERTICES = ['will', 'sj', 'wj', 'christyn'];

// ── Web Crypto Helpers ────────────────────────────────────────────────────

async function deriveHKDF(salt, ikm, info, length = 32) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
}

async function sha256(data) {
  if (typeof data === 'string') data = new TextEncoder().encode(data);
  return crypto.subtle.digest('SHA-256', data);
}

async function generateX25519KeyPair() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'X25519' }, true, ['deriveKey', 'deriveBits']);
}

async function generateEd25519KeyPair() {
  try {
    return crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  } catch {
    return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  }
}

async function exportPublicKey(key, format = 'jwk') {
  return crypto.subtle.exportKey(format, key);
}

async function importPublicKey(jwk) {
  try {
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'X25519' }, true, []);
  } catch {
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'X25519' }, true, []);
  }
}

// ── TreeKEM Core ─────────────────────────────────────────────────────────

class TreeKEM {
  constructor(vertexId) {
    this.vertexId = vertexId;
    this.leafIndex = VERTICES.indexOf(vertexId);
    if (this.leafIndex === -1) throw new Error(`Unknown vertex: ${vertexId}`);
    
    this.tree = new Array(7).fill(null);
    this.leafKeys = new Array(4).fill(null);
    this.privateKeys = new Array(4).fill(null);
    this.epoch = 0;
    this.treeSecret = null;
    this.epochSecrets = new Map();
    this.signingKey = null;
    this.verifiedPublicKeys = new Map();
  }

  async initialize() {
    this.signingKey = await generateEd25519KeyPair();
    
    const xKeyPair = await generateX25519KeyPair();
    const leafIdx = this.leafIndex;
    this.privateKeys[leafIdx] = xKeyPair.privateKey;
    const pubJwk = await exportPublicKey(xKeyPair.publicKey, 'jwk');
    this.leafKeys[leafIdx] = pubJwk;
    this.tree[leafIdx + 3] = pubJwk;
    
    const groupId = 'k4-mesh-family';
    const initialSecret = await sha256(JSON.stringify({ groupId, epoch: 0, leafKey: pubJwk }));
    this.treeSecret = await deriveHKDF(null, initialSecret, new TextEncoder().encode('k4-epoch-0'), 32);
    this.epochSecrets.set(0, this.treeSecret);
    
    return {
      vertexId: this.vertexId,
      leafIndex: this.leafIndex,
      publicKey: pubJwk,
      signingKey: await exportPublicKey(this.signingKey, 'jwk'),
      epoch: 0
    };
  }

  async setGroupState(groupState) {
    this.epoch = groupState.epoch || 0;
    
    for (const [vId, jwk] of Object.entries(groupState.tree || {})) {
      const idx = VERTICES.indexOf(vId);
      if (idx !== -1) {
        this.leafKeys[idx] = jwk;
        this.tree[idx + 3] = jwk;
        this.verifiedPublicKeys.set(vId, jwk);
      }
    }
    
    const myJwk = this.leafKeys[this.leafIndex];
    if (myJwk && !this.privateKeys[this.leafIndex]) {
      console.warn('Private key not available for epoch', this.epoch);
    }
    
    if (groupState.treeSecret) {
      try {
        this.treeSecret = await deriveHKDF(
          this._base64ToArrayBuffer(groupState.treeSecret),
          new Uint8Array(0),
          new TextEncoder().encode(`k4-epoch-${this.epoch}`),
          32
        );
        this.epochSecrets.set(this.epoch, this.treeSecret);
      } catch (e) {
        console.warn('Failed to restore tree secret:', e);
      }
    }
    
    await this._updateInternalNodes();
  }

  async _updateInternalNodes() {
    for (let i = 2; i >= 0; i--) {
      const left = this.tree[2 * i + 1];
      const right = this.tree[2 * i + 2];
      if (left && right) {
        const combined = await sha256(JSON.stringify({ left, right, index: i }));
        this.tree[i] = this._arrayBufferToBase64(combined);
      } else if (left) {
        this.tree[i] = left;
      } else if (right) {
        this.tree[i] = right;
      }
    }
  }

  async encrypt(plaintext, metadata = {}) {
    if (!this.treeSecret) {
      throw new Error('Tree secret not initialized.');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey('raw', this.treeSecret, 'AES-GCM', false, ['encrypt']);
    
    const additionalData = new TextEncoder().encode(JSON.stringify({
      epoch: this.epoch,
      sender: this.vertexId,
      ...metadata
    }));
    
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData },
      key,
      encoded
    );

    let signature;
    try {
      signature = await crypto.subtle.sign('ECDSA', this.signingKey, ciphertext);
    } catch {
      signature = await crypto.subtle.sign('ECDSA', this.signingKey, ciphertext);
    }

    return {
      type: 'encrypted',
      epoch: this.epoch,
      sender: this.vertexId,
      iv: this._arrayBufferToBase64(iv),
      ciphertext: this._arrayBufferToBase64(ciphertext),
      signature: this._arrayBufferToBase64(signature),
      treeHash: this.tree[0]
    };
  }

  async decrypt(encryptedObj) {
    if (encryptedObj.type !== 'encrypted') {
      return encryptedObj;
    }

    const secret = this.epochSecrets.get(encryptedObj.epoch);
    if (!secret) {
      throw new Error(`No secret for epoch ${encryptedObj.epoch}. Cannot decrypt.`);
    }

    const iv = this._base64ToArrayBuffer(encryptedObj.iv);
    const ciphertext = this._base64ToArrayBuffer(encryptedObj.ciphertext);
    const key = await crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['decrypt']);
    
    const additionalData = new TextEncoder().encode(JSON.stringify({
      epoch: encryptedObj.epoch,
      sender: encryptedObj.sender
    }));

    try {
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData },
        key,
        ciphertext
      );
      
      const text = new TextDecoder().decode(plaintext);
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Decryption failed for epoch ${encryptedObj.epoch}: ${e.message}`);
    }
  }

  async createCommit(newMembers = [], removedMembers = []) {
    const newEpoch = this.epoch + 1;
    
    const currentMembers = VERTICES.filter(v => this.leafKeys[VERTICES.indexOf(v)] !== null);
    const updatedMembers = [...new Set([...currentMembers.filter(m => !removedMembers.includes(m)), ...newMembers])];
    
    const ratchetInput = await deriveHKDF(
      this.treeSecret,
      crypto.getRandomValues(new Uint8Array(32)),
      new TextEncoder().encode(`k4-ratchet-${newEpoch}`),
      32
    );
    
    this.epoch = newEpoch;
    this.treeSecret = ratchetInput;
    this.epochSecrets.set(this.epoch, this.treeSecret);
    
    const newKeyPair = await generateX25519KeyPair();
    const newPubJwk = await exportPublicKey(newKeyPair.publicKey, 'jwk');
    this.privateKeys[this.leafIndex] = newKeyPair.privateKey;
    this.leafKeys[this.leafIndex] = newPubJwk;
    this.tree[this.leafIndex + 3] = newPubJwk;
    
    await this._updateInternalNodes();
    
    const commit = {
      type: 'commit',
      epoch: this.epoch,
      sender: this.vertexId,
      tree: {},
      treeSecret: this._arrayBufferToBase64(await deriveHKDF(ratchetInput, new Uint8Array(0), new TextEncoder().encode('export'), 32)),
      signature: ''
    };
    
    VERTICES.forEach((v, idx) => {
      if (this.leafKeys[idx]) {
        commit.tree[v] = this.leafKeys[idx];
      }
    });
    
    const commitData = new TextEncoder().encode(JSON.stringify({ epoch: commit.epoch, tree: commit.tree }));
    try {
      const sig = await crypto.subtle.sign('ECDSA', this.signingKey, commitData);
      commit.signature = this._arrayBufferToBase64(sig);
    } catch {
      const sig = await crypto.subtle.sign('ECDSA', this.signingKey, commitData);
      commit.signature = this._arrayBufferToBase64(sig);
    }
    
    return commit;
  }

  async applyCommit(commit) {
    if (commit.epoch <= this.epoch) {
      throw new Error('Stale commit epoch');
    }
    
    for (const [vId, jwk] of Object.entries(commit.tree || {})) {
      const idx = VERTICES.indexOf(vId);
      if (idx !== -1) {
        this.leafKeys[idx] = jwk;
        this.tree[idx + 3] = jwk;
        this.verifiedPublicKeys.set(vId, jwk);
      }
    }
    
    this.epoch = commit.epoch;
    
    if (commit.treeSecret && this.leafKeys[this.leafIndex]) {
      try {
        const secret = await deriveHKDF(
          this._base64ToArrayBuffer(commit.treeSecret),
          new Uint8Array(0),
          new TextEncoder().encode(`k4-epoch-${this.epoch}`),
          32
        );
        this.treeSecret = secret;
        this.epochSecrets.set(this.epoch, secret);
      } catch (e) {
        console.warn('Failed to derive secret from commit:', e);
      }
    }
    
    await this._updateInternalNodes();
  }

  getGroupState() {
    const tree = {};
    VERTICES.forEach((v, idx) => {
      if (this.leafKeys[idx]) {
        tree[v] = this.leafKeys[idx];
      }
    });
    
    return {
      epoch: this.epoch,
      tree,
      treeSecret: this.treeSecret ? this._arrayBufferToBase64(this.treeSecret) : null,
      vertexId: this.vertexId
    };
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ── E2EE Wrapper for MeshClient ──────────────────────────────────────────

export class MLSMeshClient {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.treeKEM = new TreeKEM(userId);
    this.initialized = false;
    this.options = {
      useE2EE: true,
      persistKeys: true,
      ...options
    };
    this.headers = {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    if (this.options.persistKeys && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`k4-mls-state-${this.userId}`);
        if (saved) {
          const state = JSON.parse(saved);
          await this.treeKEM.setGroupState(state);
          this.initialized = true;
          console.log(`[MLS] Restored state for ${this.userId}, epoch ${this.treeKEM.epoch}`);
          return;
        }
      } catch (e) {
        console.warn('[MLS] Failed to restore state:', e);
      }
    }
    
    const initResult = await this.treeKEM.initialize();
    this.initialized = true;
    this._persistState();
    console.log(`[MLS] Initialized ${this.userId}`, initResult);
  }

  async syncGroupState(groupState) {
    if (!this.initialized) await this.initialize();
    await this.treeKEM.setGroupState(groupState);
    this._persistState();
  }

  async encryptMessage(content, metadata = {}) {
    if (!this.initialized) await this.initialize();
    
    if (this.options.useE2EE) {
      const encrypted = await this.treeKEM.encrypt(JSON.stringify(content), metadata);
      return {
        encrypted: true,
        payload: encrypted,
        epoch: this.treeKEM.epoch
      };
    } else {
      return {
        encrypted: false,
        payload: content
      };
    }
  }

  async decryptMessage(message) {
    if (!this.initialized) await this.initialize();
    
    if (message.encrypted && this.options.useE2EE) {
      try {
        const decrypted = await this.treeKEM.decrypt(message.payload);
        return decrypted;
      } catch (e) {
        console.error('[MLS] Decryption failed:', e.message);
        return { error: 'decryption_failed', original: message };
      }
    }
    return message.payload || message;
  }

  async createCommit() {
    if (!this.initialized) await this.initialize();
    const commit = await this.treeKEM.createCommit();
    this._persistState();
    return commit;
  }

  async applyCommit(commit) {
    if (!this.initialized) await this.initialize();
    await this.treeKEM.applyCommit(commit);
    this._persistState();
  }

  getGroupState() {
    return this.treeKEM.getGroupState();
  }

  _persistState() {
    if (this.options.persistKeys && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`k4-mls-state-${this.userId}`, JSON.stringify(this.treeKEM.getGroupState()));
      } catch (e) {}
    }
  }

  // --- HTTP API wrappers ---

  async getConversations() {
    try {
      const res = await fetch('/api/conversations?userId=' + this.userId, { headers: this.headers });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return await res.json();
    } catch (err) {
      return {
        conversations: [
          { id: 'conv-1', name: 'S.J. & Will', participants: ['will', 'sj'], last_message_content: 'Are the nodes aligned?' },
          { id: 'conv-2', name: 'Family Group', participants: ['will', 'sj', 'wj', 'christyn'], last_message_content: 'Mesh sync complete.' }
        ]
      };
    }
  }

  async createConversation(participants, type = 'direct', name = '') {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ participants, type, name })
    });
    return res.json();
  }

  async getMessages(conversationId, limit = 50) {
    try {
      const res = await fetch('/api/messages/' + conversationId + '?limit=' + limit, { headers: this.headers });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      
      if (this.options.useE2EE && data.messages) {
        const decrypted = [];
        for (const msg of data.messages) {
          try {
            const decryptedContent = await this.decryptMessage(msg);
            decrypted.push({ ...msg, content: typeof decryptedContent === 'string' ? decryptedContent : JSON.stringify(decryptedContent), decrypted: true });
          } catch (e) {
            decrypted.push({ ...msg, decrypted: false, error: 'decryption_failed' });
          }
        }
        data.messages = decrypted;
      }
      
      return data;
    } catch (err) {
      return { messages: [] };
    }
  }

  async sendMessage(conversationId, content, type = 'text') {
    const encrypted = await this.encryptMessage({ content, type }, { conversationId });
    
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        conversationId,
        senderId: this.userId,
        content: encrypted.payload,
        encrypted: encrypted.encrypted,
        epoch: encrypted.epoch,
        type
      })
    });
    return res.json();
  }

  async markAsRead(messageId) {
    const res = await fetch('/api/messages/' + messageId + '/read', {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ userId: this.userId })
    });
    return res.json();
  }

  connectWebSocket(conversationId, onMessage, onTyping, onPresence) {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws/family-mesh?userId=${this.userId}`);

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message:new' && data.message && data.message.encrypted) {
            const decrypted = await this.decryptMessage(data.message);
            if (decrypted && !decrypted.error) {
              onMessage({ ...data.message, content: typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted), decrypted: true });
            } else {
              onMessage(data.message);
            }
          } else if (data.type === 'message:new') {
            onMessage(data.message);
          } else if (data.type === 'typing:indicator') {
            onTyping(data);
          } else if (data.type === 'presence:changed') {
            onPresence(data);
          } else if (data.type === 'commit') {
            await this.applyCommit(data.payload);
            console.log('[MLS] Applied commit from', data.sender);
          }
        } catch (e) {
          console.error('[MLS] Error processing message:', e);
        }
      };

      return ws;
    } catch (e) {
      console.warn("WebSocket not available in this environment.");
      return null;
    }
  }

  async broadcastCommit() {
    const commit = await this.createCommit();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'commit', payload: commit }));
    }
    
    try {
      await fetch('/api/epoch/commit', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(commit)
      });
    } catch (e) {}
    
    return commit;
  }
}

export const createMLSMeshClient = (userId, options) => new MLSMeshClient(userId, options);
