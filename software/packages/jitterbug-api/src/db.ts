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

  async findStuckBrainDumps(olderThanMinutes = 10, limit = 10): Promise<Array<{ id: string; status: string; error?: string }>> {
    const result = await this.db
      .prepare(
        `SELECT id, status, error FROM brain_dumps 
         WHERE status IN ('processing', 'failed') 
           AND created_at < datetime('now', '-' || ? || ' minutes')
         ORDER BY created_at DESC LIMIT ?`
      )
      .bind(olderThanMinutes, limit)
      .all();
    return (result.results as any) ?? [];
  }

  async resetBrainDump(id: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE brain_dumps SET status = 'pending', error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(id)
      .run();
  }

  // ----- User Testing -----

  async ut_listParticipants(filters?: { pseudonym?: string; cohort?: string }) {
    let sql = 'SELECT * FROM ut_participants';
    const params: any[] = [];
    if (filters?.pseudonym) {
      sql += ' WHERE pseudonym = ?';
      params.push(filters.pseudonym);
    } else if (filters?.cohort) {
      sql += ' WHERE cohort = ?';
      params.push(filters.cohort);
    }
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results;
  }

  async ut_createParticipant(data: {
    pseudonym: string; neurotype?: string; cohort: string;
    age_band?: string; access_needs_json?: string; payment_method?: string;
    consent_given?: boolean; caregiver_assent?: boolean;
  }) {
    const { pseudonym, neurotype, cohort, age_band, access_needs_json, payment_method, consent_given, caregiver_assent } = data;
    const result = await this.db.prepare(`
      INSERT INTO ut_participants
      (pseudonym, neurotype, cohort, age_band, access_needs_json, payment_method, consent_given, caregiver_assent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(pseudonym, neurotype || null, cohort, age_band || null, access_needs_json || null, payment_method || null, consent_given ? 1 : 0, caregiver_assent ? 1 : 0).run();
    return (result.meta as any)?.last_row_id;
  }

  async ut_getParticipant(id: number) {
    return this.db.prepare('SELECT * FROM ut_participants WHERE id = ?').bind(id).first();
  }

  async ut_getParticipantByPseudonym(pseudonym: string) {
    return this.db.prepare('SELECT * FROM ut_participants WHERE pseudonym = ?').bind(pseudonym).first();
  }

  async ut_updateParticipant(id: number, data: any) {
    const fields = Object.keys(data);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => data[f]);
    await this.db.prepare(`UPDATE ut_participants SET ${setClause} WHERE id = ?`).bind(...values, id).run();
  }

  async ut_listSessions(filters?: { participant_id?: number; phase?: number }) {
    let sql = 'SELECT * FROM ut_sessions';
    const params: any[] = [];
    const where: string[] = [];
    if (filters?.participant_id) { where.push('participant_id = ?'); params.push(filters.participant_id); }
    if (filters?.phase) { where.push('phase = ?'); params.push(filters.phase); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results;
  }

  async ut_createSession(data: {
    participant_id: number; phase: number; session_date?: string; format: string;
    spoons_start: number; spoons_end: number; wcag_json?: string;
    payment_amount?: number; paid?: boolean; notes?: string;
  }) {
    const { participant_id, phase, session_date, format, spoons_start, spoons_end, wcag_json, payment_amount, paid, notes } = data;
    const result = await this.db.prepare(`
      INSERT INTO ut_sessions
      (participant_id, phase, session_date, format, spoons_start, spoons_end, wcag_json, payment_amount, paid, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(participant_id, phase, session_date || null, format, spoons_start, spoons_end, wcag_json || null, payment_amount ?? null, paid ? 1 : 0, notes || null).run();
    return (result.meta as any)?.last_row_id;
  }

  async ut_getSession(id: number) {
    return this.db.prepare('SELECT * FROM ut_sessions WHERE id = ?').bind(id).first();
  }

  async ut_updateSession(id: number, data: any) {
    const fields = Object.keys(data);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => data[f]);
    await this.db.prepare(`UPDATE ut_sessions SET ${setClause} WHERE id = ?`).bind(...values, id).run();
  }

  async ut_listFindings(session_id?: number) {
    let sql = 'SELECT * FROM ut_findings';
    if (session_id) {
      sql += ' WHERE session_id = ?';
      const result = await this.db.prepare(sql).bind(session_id).all();
      return result.results;
    }
    const result = await this.db.prepare(sql).all();
    return result.results;
  }

  async ut_createFinding(data: {
    session_id: number; severity: number; category?: string; description?: string; suggested_fix?: string;
  }) {
    const { session_id, severity, category, description, suggested_fix } = data;
    const result = await this.db.prepare(`
      INSERT INTO ut_findings (session_id, severity, category, description, suggested_fix)
      VALUES (?, ?, ?, ?, ?)
    `).bind(session_id, severity, category || null, description || null, suggested_fix || null).run();
    return (result.meta as any)?.last_row_id;
  }

  async ut_listDeadlines() {
    const result = await this.db.prepare('SELECT * FROM ut_deadlines').all();
    return result.results;
  }

  async ut_upsertDeadline(data: { label: string; due_date?: string; owner?: string; met?: boolean }) {
    const { label, due_date, owner, met } = data;
    await this.db.prepare(`
      INSERT OR REPLACE INTO ut_deadlines (label, due_date, owner, met)
      VALUES (?, ?, ?, ?)
    `).bind(label, due_date || null, owner || null, met ? 1 : 0).run();
  }
}
