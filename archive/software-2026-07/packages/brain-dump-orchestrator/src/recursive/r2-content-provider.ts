import type { K4ContentProvider } from './k4-types.js';
import type { DeliverableTracker } from '../agents/deliverable-tracker.js';

export class R2ContentProvider implements K4ContentProvider {
  constructor(private tracker: DeliverableTracker) {}

  async getContent(filePaths: string[], axisId: string): Promise<string> {
    const parts = await Promise.all(
      filePaths.map(async (path) => {
        const content = await this.tracker.getFileContent(path, axisId);
        return content || `[empty: ${path}]`;
      })
    );

    return parts.filter((c: string) => c && !c.startsWith('[empty')).join('\n\n---\n\n');
  }
}
