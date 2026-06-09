/**
 * P31 Cloudflare Worker Types
 * 
 * Type definitions for Cloudflare Workers runtime
 * @version 1.0.0
 * @date March 24, 2026
 */

// Cloudflare runtime types - these are normally provided by @cloudflare/workers-types
// This file provides type definitions when that package isn't available

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: { expirationTtl?: number; expiration?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number }>; list_complete: boolean; cursor?: string }>;
}

export interface R2Bucket {
  get(key: string, options?: { range?: { offset?: number; length?: number } }): Promise<R2Object | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: R2Object[]; list_complete: boolean; cursor?: string }>;
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    contentEncoding?: string;
    customMetadata?: Record<string, string>;
  };
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  httpMetadata: {
    contentType?: string;
    contentEncoding?: string;
  };
  customMetadata: Record<string, string>;
  write(): Promise<void>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<void>;
}

export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
}

export interface D1Result {
  success: boolean;
  meta?: Record<string, unknown>;
  results?: unknown[];
  error?: string;
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

// Base Durable Object interface (implement this in your DO class)
export interface DurableObject {
  fetch(request: Request): Promise<Response>;
}

export interface DurableObjectState {
  waitUntil(promise: Promise<unknown>): void;
  storage: DurableObjectStorage;
  readonly id: DurableObjectId;
}

export interface DurableObjectStorage {
  get<T = unknown>(key: string, options?: { allowConcurrency?: boolean }): Promise<T | null>;
  put<T = unknown>(key: string, value: T, options?: { allowConcurrency?: boolean }): Promise<void>;
  delete(key: string, options?: { allowConcurrency?: boolean }): Promise<void>;
  list<T = unknown>(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<Map<string, T>>;
}

export interface PubSub {
  publish(topic: string, message: string | ReadableStream | ArrayBuffer): Promise<void>;
  subscribe(topic: string): AsyncIterable<PubSubMessage>;
}

export interface PubSubMessage {
  payload: ArrayBuffer;
}

export interface Queue {
  send(message: string): Promise<void>;
}

export interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface TraceSpan {
  end(options?: { status?: number }): void;
}
