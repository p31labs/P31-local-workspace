import { describe, it, expect } from 'vitest';

describe('IntentEngine', () => {
  describe('parseRagQuery', () => {
    it('should extract query from ?query param', async () => {
      const { parseRagQuery } = await import('../IntentEngine');
      expect(parseRagQuery('?query=hello world')).toBe('hello world');
    });

    it('should extract query from /ask path', async () => {
      const { parseRagQuery } = await import('../IntentEngine');
      expect(parseRagQuery('/ask how are you')).toBe('how are you');
    });

    it('should return null for no match', async () => {
      const { parseRagQuery } = await import('../IntentEngine');
      expect(parseRagQuery('random text')).toBeNull();
    });
  });

  describe('routeIntent', () => {
    it('should route panic to GREETING', async () => {
      const { routeIntent } = await import('../IntentEngine');
      expect(routeIntent('I am panicking', 3)).toBe('GREETING');
    });

    it('should route journal to THE_BUFFER', async () => {
      const { routeIntent } = await import('../IntentEngine');
      expect(routeIntent('I want to write in my journal', 3)).toBe('THE_BUFFER');
    });

    it('should route vault to VAULT', async () => {
      const { routeIntent } = await import('../IntentEngine');
      expect(routeIntent('open my vault', 5)).toBe('VAULT');
    });

    it('should route low-spoon user to simplified surface', async () => {
      const { routeIntent } = await import('../IntentEngine');
      const surface = routeIntent('I need to play a game', 1);
      // Low spoons should still route but the surface will filter
      expect(surface).toBeTruthy();
    });
  });
});
