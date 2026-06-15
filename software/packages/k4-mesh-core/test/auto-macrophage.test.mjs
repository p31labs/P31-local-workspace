import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as personal-handlers from '../personal-handlers.js';

const requestUrl = 'https://example.com/api/mesh';
const ctx = {};

test('personalMesh returns 200 and headers when valid payload is provided', async () => {
  const response = await personalMesh(null, requestUrl, ctx);
  expect(response.status).toBe(200);
});

test('personalPresence returns 200 with updated vertex data', async () => {
  const id = 'a';
  const body = { status: 'online' };
  const parsedBody = JSON.stringify(body);

  const response = await personalPresence(null, null, id, ctx);
  expect(response.status).toBe(200);
});

test('personalPing returns 200 with updated edge data', async () => {
  const from = 'a';
  const to = 'b';
  const body = { status: 'online' };
  const parsedBody = JSON.stringify(body);

  const response = await personalPing(null, null, from, to, ctx);
  expect(response.status).toBe(200);
});

test('personalMesh returns error for unknown vertex', async () => {
  const requestUrl = 'https://example.com/api/mesh';
  const ctx = { requestId: '12345' };

  await expect(personalMesh(null, requestUrl, ctx)).rejects.toThrowError(/Unknown vertex/);
});

test('personalPresence returns error for invalid vertex', async () => {
  const PERSONAL_SCOPE = 'personal';
  const id = 'e'; // Invalid vertex
  const parsedBody = JSON.stringify({ status: 'online' });

  await expect(personalPresence(null, null, id)).rejects.toThrowError(/Unknown vertex/);
});

test('personalPing returns error for invalid edge', async () => {
  const PERSONAL_SCOPE = 'personal';
  const from = 'a'; // Invalid edge
  const to = 'b';
  const parsedBody = JSON.stringify({ status: 'online' });

  await expect(personalPing(null, null, from, to)).rejects.toThrowError(/Invalid edge/);
});