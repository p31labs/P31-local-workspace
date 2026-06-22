export interface BrainDumpRecord {
  id: string;
  project_name: string;
  core_problem: string;
  constraints_json: string;
  assets_json: string;
  questions_json: string;
  desired_end_state_json: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial_failure';
  axes_json?: string;
  convergence_result_json?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  depth: number;
  parent_id?: string;
  lineage: string;
  is_atomic: boolean;
  batch_strategy: string;
  max_depth: number;
}

export class DBClient {
  constructor(private db: D1Database) {}

  async createBrainDump(data: {
    project_name: string;
    core_problem: string;
    constraints_json: string;
    assets_json: string;
    questions_json: string;
    desired_end_state_json: string;
    depth?: number;
    parent_id?: string | null;
    lineage?: string;
    is_atomic?: boolean;
    batch_strategy?: string;
    max_depth?: number;
    purge_at?: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO brain_dumps 
        (id, project_name, core_problem, constraints_json, assets_json, questions_json, 
         desired_end_state_json, status, depth, parent_id, lineage, is_atomic, batch_strategy, max_depth, purge_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.project_name,
        data.core_problem,
        data.constraints_json,
        data.assets_json,
        data.questions_json,
        data.desired_end_state_json,
        data.depth ?? 0,
        data.parent_id ?? null,
        data.lineage ?? '[]',
        data.is_atomic ?? false,
        data.batch_strategy ?? 'depth-first',
        data.max_depth ?? 3,
        data.purge_at ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      )
      .run();
    return id;
  }

  async schedulePurge(id: string, days = 90): Promise<void> {
    const purgeAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await this.db
      .prepare('UPDATE brain_dumps SET purge_at = ? WHERE id = ?')
      .bind(purgeAt, id)
      .run();
  }

  async purgeExpired(): Promise<number> {
    const result = await this.db
      .prepare('DELETE FROM brain_dumps WHERE purge_at IS NOT NULL AND purge_at < CURRENT_TIMESTAMP')
      .run();
    return (result.meta as any).changes ?? 0;
  }
  async getBrainDump(id: string): Promise<BrainDumpRecord | null> {
    const result = await this.db.prepare('SELECT * FROM brain_dumps WHERE id = ?').bind(id).first();
    return result as BrainDumpRecord | null;
  }

  async updateStatus(id: string, status: string, error?: string): Promise<void> {
    await this.db
      .prepare('UPDATE brain_dumps SET status = ?, error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(status, error || null, id)
      .run();
  }

  async updateAxes(id: string, axes_json: string): Promise<void> {
    await this.db
      .prepare('UPDATE brain_dumps SET axes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(axes_json, id)
      .run();
  }

  async updateConvergence(id: string, convergence_result_json: string): Promise<void> {
    await this.db
      .prepare('UPDATE brain_dumps SET convergence_result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(convergence_result_json, id)
      .run();
  }

  async listRecent(limit = 20): Promise<Array<{
    id: string;
    project_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    error?: string;
  }>> {
    const result = await this.db
      .prepare('SELECT id, project_name, status, created_at, updated_at, error FROM brain_dumps ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all();
    return (result.results as any) ?? [];
  }
}
