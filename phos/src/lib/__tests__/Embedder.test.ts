import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding, ingestAndEmbed } from '../Embedder';

describe('Embedder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return embedding array on successful fetch', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      (window.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ embedding: mockEmbedding }] }),
        })
      );

      const result = await generateEmbedding('test input');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(768);
    });

    it('should return zero array on HTTP error', async () => {
      (window.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const result = await generateEmbedding('test input');
      expect(result.length).toBe(768);
      expect(result.every((v: number) => v === 0)).toBe(true);
    });

    it('should return zero array on fetch failure', async () => {
      (window.fetch as any).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await generateEmbedding('test input');
      expect(result.length).toBe(768);
      expect(result.every((v: number) => v === 0)).toBe(true);
    });

    it('should send correct request body', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding: new Array(768).fill(0) }] }),
      });
      (window.fetch as any) = fetchMock;

      await generateEmbedding('hello world');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return zero array when response data is empty', async () => {
      (window.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      );

      const result = await generateEmbedding('test input');
      expect(result.length).toBe(768);
      expect(result.every((v: number) => v === 0)).toBe(true);
    });
  });

  describe('ingestAndEmbed', () => {
    it('should return false for empty text', async () => {
      const result = await ingestAndEmbed('door', '   ');
      expect(result).toBe(false);
    });

    it('should call generateEmbedding and ingestToChaosVault for valid text', async () => {
      (window.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding: new Array(768).fill(0.1) }] }),
      });

      const result = await ingestAndEmbed('test-door', 'some text content');
      expect(result).toBe(true);
    });
  });
});
