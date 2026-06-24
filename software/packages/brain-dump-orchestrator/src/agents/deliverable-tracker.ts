export interface DeliverableRecord {
  key: string;
  axisId: string;
  writtenAt: string;
  size: number;
}

export interface DeliverableTracker {
  recordFile(filePath: string, axisId: string, content: string): Promise<void>;
  getFilesForAxis(axisId: string): Promise<string[]>;
  getAllFiles(): Promise<string[]>;
  getFileContent(filePath: string, axisId: string): Promise<string | null>;
  deleteAll(): Promise<void>;
}

export interface R2BucketLike {
  put(key: string, value: string | ArrayBuffer | ReadableStream): Promise<void>;
  get(key: string): Promise<R2ObjectLike | null>;
  list(options?: { prefix?: string }): Promise<{ objects: R2ObjectLike[] }>;
  delete(key: string): Promise<void>;
}

export interface R2ObjectLike {
  key: string;
  text(): Promise<string>;
}

export class R2DeliverableTracker implements DeliverableTracker {
  constructor(private bucket: R2BucketLike, private batchId: string) {}

  async recordFile(filePath: string, axisId: string, content: string): Promise<void> {
    const key = `${this.batchId}/${axisId}/${filePath}`;
    await this.bucket.put(key, content);
  }

  async getFilesForAxis(axisId: string): Promise<string[]> {
    const prefix = `${this.batchId}/${axisId}/`;
    const list = await this.bucket.list({ prefix });
    return list.objects.map(obj => obj.key.replace(prefix, ''));
  }

  async getAllFiles(): Promise<string[]> {
    const prefix = `${this.batchId}/`;
    const list = await this.bucket.list({ prefix });
    return list.objects.map(obj => obj.key.replace(prefix, ''));
  }

  async getFileContent(filePath: string, axisId: string): Promise<string | null> {
    const key = `${this.batchId}/${axisId}/${filePath}`;
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return obj.text();
  }

  async deleteAll(): Promise<void> {
    const prefix = `${this.batchId}/`;
    const list = await this.bucket.list({ prefix });
    await Promise.all(list.objects.map(obj => this.bucket.delete(obj.key)));
  }
}

export class InMemoryDeliverableTracker implements DeliverableTracker {
  private files: Map<string, { axisId: string; writtenAt: string; size: number }> = new Map();

  async recordFile(filePath: string, axisId: string, _content: string): Promise<void> {
    this.files.set(filePath, { axisId, writtenAt: new Date().toISOString(), size: _content.length });
  }

  async getFilesForAxis(axisId: string): Promise<string[]> {
    return Array.from(this.files.entries())
      .filter(([, meta]) => meta.axisId === axisId)
      .map(([path]) => path);
  }

  async getAllFiles(): Promise<string[]> {
    return Array.from(this.files.keys());
  }

  async getFileContent(filePath: string): Promise<string | null> {
    return null;
  }

  async deleteAll(): Promise<void> {
    this.files.clear();
  }
}
