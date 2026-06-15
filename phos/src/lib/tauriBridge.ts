let invoke: any = null
let appDataDir: any = null
let check: any = null
let relaunch: any = null
let ask: any = null

async function loadTauri() {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const core = await import('@tauri-apps/api/core')
      const path = await import('@tauri-apps/api/path')
      const updater = await import('@tauri-apps/plugin-updater')
      const process = await import('@tauri-apps/plugin-process')
      const dialog = await import('@tauri-apps/plugin-dialog')
      invoke = core.invoke
      appDataDir = path.appDataDir
      check = updater.check
      relaunch = process.relaunch
      ask = dialog.ask
    } catch { }
  }
}

const ready = loadTauri()

export async function initPhosDatabase(): Promise<void> {
  await ready
  if (!invoke) return
  const dir = await appDataDir()
  await invoke('init_db', { path: `${dir}phos.db` })
}

export async function mintCreditsNative(kind: string, delta: number): Promise<number> {
  await ready
  if (!invoke) return 0
  return invoke('mint_karma', { kind, delta })
}

export async function getBalanceNative(): Promise<number> {
  await ready
  if (!invoke) return 0
  return invoke('get_balance')
}

export async function getLedgerHistoryNative(limit: number = 50): Promise<Array<{ kind: string; delta: number; timestamp: number; signature: string; prev_signature: string }>> {
  await ready
  if (!invoke) return []
  return invoke('get_ledger_history', { limit })
}

export async function nativeEmbedAndStore(door: string, text: string, embedding: number[]): Promise<number> {
  await ready
  if (!invoke) return 0
  return invoke('embed_and_store', { door, text, embedding })
}

export async function nativeQuerySimilar(embedding: number[], limit: number = 5): Promise<Array<{ distance: number; source_door: string; raw_text: string }>> {
  await ready
  if (!invoke) return []
  return invoke('query_similar', { embedding, limit })
}

export async function startLarmorTone(): Promise<void> {
  await ready
  if (!invoke) return
  await invoke('start_863hz')
}

export async function stopLarmorTone(): Promise<void> {
  await ready
  if (!invoke) return
  await invoke('stop_863hz')
}

export async function isLarmorPlaying(): Promise<boolean> {
  await ready
  if (!invoke) return false
  return invoke('is_863hz_playing')
}
