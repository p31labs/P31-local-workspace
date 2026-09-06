export class CortexDOAdapter {
  constructor(private env?: {
    ORCHESTRATOR_DO?: {
      idFromName: (name: string) => {
        get: (stub: unknown) => {
          fetch: (req: Request) => Promise<Response>;
        };
      };
    };
  }) {}

  async dispatch(
    _agent: { axisId: string; mission: string; role: string; runtime: string },
    _prompt: { system: string; user: string; outputFiles: string[] }
  ): Promise<{ success: boolean; filesWritten: string[]; statusLine: string; startedAt: string; completedAt: string; error?: string }> {
    const startedAt = new Date().toISOString();
    return {
      success: false,
      filesWritten: [],
      statusLine: `Cortex DO dispatch stub — bind ORCHESTRATOR_DO to enable`,
      startedAt,
      completedAt: new Date().toISOString(),
      error: 'CortexDOAdapter is a stub — configure env.ORCHESTRATOR_DO to enable',
    };
  }

  supports(runtime: string): boolean {
    return runtime === 'cortex-do';
  }
}
