import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reset the ChaosVault singleton between tests
vi.mock('@electric-sql/pglite', () => ({
  PGlite: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ rows: [] }),
    exec: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// We need to reset the module-level dbInstance before each test
async function resetChaosVault() {
  vi.resetModules();
}

describe('ChaosVault', () => {
  beforeEach(async () => {
    await resetChaosVault();
  });

  describe('getChaosVault', () => {
    it('should return a database instance', async () => {
      const { getChaosVault } = await import('../ChaosVault');
      const db = await getChaosVault();
      expect(db).toBeTruthy();
    });

    it('should create PGlite with idb:// connection string', async () => {
      const { getChaosVault } = await import('../ChaosVault');
      const { PGlite } = await import('@electric-sql/pglite');
      await getChaosVault();
      expect(PGlite).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: 'idb://p31-chaos-vault',
        })
      );
    });

    it('should create the unified_knowledge_graph table on init', async () => {
      const mockExec = vi.fn().mockResolvedValue([]);
      const { PGlite } = await import('@electric-sql/pglite');
      (PGlite as any).mockImplementationOnce(() => ({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        exec: mockExec,
        close: vi.fn().mockResolvedValue(undefined),
      }));

      const { getChaosVault } = await import('../ChaosVault');
      await getChaosVault();
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS unified_knowledge_graph')
      );
    });
  });

  describe('ingestToChaosVault', () => {
    it('should insert data successfully', async () => {
      const { ingestToChaosVault } = await import('../ChaosVault');
      await ingestToChaosVault('test-door', 'test text', [0.1, 0.2, 0.3]);
      // If we get here without error, it succeeded
      expect(true).toBe(true);
    });
  });

  describe('querySimilarity', () => {
    it('should return empty array for zero magnitude query', async () => {
      const { querySimilarity } = await import('../ChaosVault');
      const result = await querySimilarity(new Array(768).fill(0));
      expect(result).toEqual([]);
    });

    it('should return results from database', async () => {
      const { querySimilarity } = await import('../ChaosVault');
      const result = await querySimilarity(new Array(768).fill(0.001));
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
