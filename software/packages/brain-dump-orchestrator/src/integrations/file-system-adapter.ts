import * as fs from 'fs';
import type { Axis, AgentRunResult } from '../types/index.js';

export class FileSystemAdapter {
  async writeDeliverables(axis: { id?: string }, content: Record<string, string>): Promise<AgentRunResult> {
    const filesWritten: string[] = [];

    for (const [filePath, fileContent] of Object.entries(content)) {
      const fullPath = filePath;
      const dir = fullPath.split('/').slice(0, -1).join('/');
      if (dir) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, fileContent, 'utf-8');
      filesWritten.push(filePath);
    }

    return {
      success: filesWritten.length === Object.keys(content).length,
      filesWritten,
      statusLine: `Wrote ${filesWritten.length} files`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async readDeliverable(filePath: string): Promise<string | null> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
