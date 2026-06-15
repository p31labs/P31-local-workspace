import { describe, it, expect, vi } from "vitest";
import { Bus, BroadcastAdapter, LocalStorageAdapter } from "../src/index.js";

// Mock localStorage for Node
const storage = new Map<string, string>();
const origLocalStorage = globalThis.localStorage;

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => { storage.set(k, v); },
      removeItem: (k: string) => { storage.delete(k); },
      clear: () => storage.clear(),
      get length() { return storage.size; },
      key: (i: number) => [...storage.keys()][i] ?? null,
    },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: origLocalStorage,
    writable: true,
    configurable: true,
  });
});

describe("Bus", () => {
  it("emits and receives events within same process", () => {
    const bus = new Bus({ forceLocalStorage: true });
    const fn = vi.fn();
    bus.on("spoons", fn);
    bus.emit("spoons", 3);
    expect(fn).toHaveBeenCalledWith(3, "spoons");
    bus.destroy();
  });

  it("support multiple listeners on same key", () => {
    const bus = new Bus({ forceLocalStorage: true });
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on("test", fn1);
    bus.on("test", fn2);
    bus.emit("test", "value");
    expect(fn1).toHaveBeenCalledWith("value", "test");
    expect(fn2).toHaveBeenCalledWith("value", "test");
    bus.destroy();
  });

  it("supports multiple keys", () => {
    const bus = new Bus({ forceLocalStorage: true });
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on("key1", fn1);
    bus.on("key2", fn2);
    bus.emit("key1", "a");
    bus.emit("key2", "b");
    expect(fn1).toHaveBeenCalledWith("a", "key1");
    expect(fn2).toHaveBeenCalledWith("b", "key2");
    bus.destroy();
  });

  it("unsubscribe removes listener", () => {
    const bus = new Bus({ forceLocalStorage: true });
    const fn = vi.fn();
    const unsub = bus.on("test", fn);
    unsub();
    bus.emit("test", "value");
    expect(fn).not.toHaveBeenCalled();
    bus.destroy();
  });

  it("destroy cleans up all adapters", () => {
    const bus = new Bus({ forceLocalStorage: true });
    const fn = vi.fn();
    bus.on("test", fn);
    bus.destroy();
    bus.emit("test", "value");
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("BroadcastAdapter", () => {
  it("can create and destroy without errors", () => {
    const adapter = new BroadcastAdapter("test-channel");
    adapter.destroy();
  });

  it("emits locally on same adapter", () => {
    const adapter = new BroadcastAdapter("test-channel-2");
    const fn = vi.fn();
    adapter.on("key", fn);
    adapter.emit("key", 42);
    expect(fn).toHaveBeenCalledWith(42, "key");
    adapter.destroy();
  });
});

describe("LocalStorageAdapter", () => {
  it("stores and retrieves via listeners", () => {
    const adapter = new LocalStorageAdapter("test");
    const fn = vi.fn();
    adapter.on("key", fn);
    adapter.emit("key", { foo: "bar" });
    expect(fn).toHaveBeenCalledWith({ foo: "bar" }, "key");
    adapter.destroy();
  });

  it("supports multiple listeners", () => {
    const adapter = new LocalStorageAdapter("test");
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    adapter.on("key", fn1);
    adapter.on("key", fn2);
    adapter.emit("key", "val");
    expect(fn1).toHaveBeenCalledWith("val", "key");
    expect(fn2).toHaveBeenCalledWith("val", "key");
    adapter.destroy();
  });

  it("unsubscribe works", () => {
    const adapter = new LocalStorageAdapter("test");
    const fn = vi.fn();
    const unsub = adapter.on("key", fn);
    unsub();
    adapter.emit("key", "val");
    expect(fn).not.toHaveBeenCalled();
    adapter.destroy();
  });
});
