import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('KenosisMesh', () => {
  let getKenosisMesh: () => {
    getConnectionState: () => string;
    isConnected: () => boolean;
    getLastError: () => string | null;
    connect: (_: string) => Promise<void>;
    disconnect: () => void;
    onPeerCount: (_: (_: number) => void) => () => void;
  };

  beforeEach(async () => {
    const listeners: Record<string, Array<() => void>> = {};
    const awarenessMap = new Map<number, unknown>();

    const shared = {
      awareness: {
        getStates: () => awarenessMap,
        on: (ev: string, cb: () => void) => { (listeners[ev] = listeners[ev] || []).push(cb); },
      },
      on: (ev: string, cb: () => void) => { (listeners[ev] = listeners[ev] || []).push(cb); },
      disconnect: vi.fn(),
      destroy: vi.fn(),
    };

    let ctorCalls = 0;
    function createMock() {
      ctorCalls++;
      const inst = { ...shared, __listeners: listeners };
      return inst;
    }

    vi.resetModules();
    vi.doMock('yjs', () => ({
      Doc: class { destroy = vi.fn(); },
    }));
    vi.doMock('y-webrtc', () => ({
      WebrtcProvider: createMock,
    }));

    const mod = await import('../lib/engine/kenosisMesh');
    getKenosisMesh = (mod as any).getKenosisMesh;
    (mod as any).resetKenosisMesh();

    (shared as any).__ctorCalls = ctorCalls;
    (shared as any).__trigger = (event: string) => (listeners[event] || []).forEach(cb => cb());
    (shared as any).__setPeers = (count: number) => {
      awarenessMap.clear();
      for (let i = 0; i < count; i++) awarenessMap.set(i, {});
      (listeners['change'] || []).forEach(cb => cb());
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getProvider = (mesh: any) => (mesh as any).provider;
  const trigger = (inst: any, event: string) => inst.__trigger(event);
  const setPeers = (inst: any, count: number) => inst.__setPeers(count);

  describe('initial state', () => {
    it('starts disconnected', async () => {
      const { getKenosisMesh: gkm } = await import('../lib/engine/kenosisMesh');
      expect(gkm().getConnectionState()).toBe('disconnected');
    });

    it('isConnected returns false initially', async () => {
      const { getKenosisMesh: gkm } = await import('../lib/engine/kenosisMesh');
      expect(gkm().isConnected()).toBe(false);
    });

    it('getLastError returns null initially', async () => {
      const { getKenosisMesh: gkm } = await import('../lib/engine/kenosisMesh');
      expect(gkm().getLastError()).toBe(null);
    });
  });

  describe('singleton', () => {
    it('returns same instance', async () => {
      const { getKenosisMesh: gkm } = await import('../lib/engine/kenosisMesh');
      expect(gkm()).toBe(gkm());
    });
  });

  describe('connect', () => {
    it('transitions through disconnected → connecting → handshaking', async () => {
      const mesh = getKenosisMesh();
      expect(mesh.getConnectionState()).toBe('disconnected');
      await mesh.connect('room-1');
      expect(mesh.getConnectionState()).toBe('handshaking');
    });

    it('provider.on callbacks are registered and fireable', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-2');
      const inst = getProvider(mesh);
      expect(inst).toBeTruthy();
      const syncedListeners = (inst as any).__listeners?.synced;
      expect(syncedListeners).toBeDefined();
      expect(syncedListeners.length).toBeGreaterThan(0);
    });

    it('transitions to error when connection-failed fires during connect', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-3');
      const inst = getProvider(mesh);
      trigger(inst, 'connection-failed');
      expect(mesh.getConnectionState()).toBe('error');
      expect(mesh.getLastError()).toBe('WebRTC connection failed');
    });

    it('is a no-op when already connecting', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room');
      const firstState = mesh.getConnectionState();
      await mesh.connect('room');
      expect(mesh.getConnectionState()).toBe(firstState);
    });
  });

  describe('disconnect', () => {
    it('destroys provider and resets to disconnected', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-x');
      const inst = getProvider(mesh);
      expect(mesh.getConnectionState()).toBe('handshaking');
      mesh.disconnect();
      expect(mesh.getConnectionState()).toBe('disconnected');
      expect(mesh.isConnected()).toBe(false);
      expect(inst.disconnect).toHaveBeenCalled();
      expect(inst.destroy).toHaveBeenCalled();
    });

    it('clears lastError on disconnect', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-y');
      trigger(getProvider(mesh), 'connection-failed');
      expect(mesh.getLastError()).not.toBeNull();
      mesh.disconnect();
      expect(mesh.getLastError()).toBeNull();
    });
  });

  describe('peer count', () => {
    it('emits peer count via awareness change', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-p');
      const inst = getProvider(mesh);
      trigger(inst, 'synced');

      const counts: number[] = [];
      mesh.onPeerCount((c) => counts.push(c));

      setPeers(inst, 2);
      trigger(inst, 'change');
      expect(counts).toContain(2);

      setPeers(inst, 1);
      trigger(inst, 'change');
      expect(counts).toContain(1);
    });

    it('returns unsubscribe function', async () => {
      const mesh = getKenosisMesh();
      const counts: number[] = [];
      const unsub = mesh.onPeerCount((c) => counts.push(c));
      unsub();
      mesh.onPeerCount((c) => counts.push(c));
      expect(counts.length).toBe(0);
    });
  });

  describe('connection-close event', () => {
    it('sets disconnected with error on connection-close', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-c');
      const inst = getProvider(mesh);
      (mesh as any).state = 'connected';
      trigger(inst, 'connection-close');
      expect(mesh.getConnectionState()).toBe('disconnected');
      expect(mesh.getLastError()).toBe('Peer connection closed');
    });

    it('ignores connection-close when already disconnected', async () => {
      const mesh = getKenosisMesh();
      await mesh.connect('room-c2');
      const inst = getProvider(mesh);
      mesh.disconnect();
      trigger(inst, 'connection-close');
      expect(mesh.getLastError()).toBeNull();
    });
  });

  describe('interface contract', () => {
    it('exposes all KenosisMeshClass methods', async () => {
      const mesh = getKenosisMesh();
      expect(typeof mesh.getConnectionState).toBe('function');
      expect(typeof mesh.isConnected).toBe('function');
      expect(typeof mesh.getLastError).toBe('function');
      expect(typeof mesh.connect).toBe('function');
      expect(typeof mesh.disconnect).toBe('function');
      expect(typeof mesh.onPeerCount).toBe('function');
    });
  });
});
