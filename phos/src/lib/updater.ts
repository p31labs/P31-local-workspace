export async function checkForUpdates() {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const { relaunch } = await import('@tauri-apps/plugin-process')
    const { ask } = await import('@tauri-apps/plugin-dialog')
    const update = await check()
    if (update?.available) {
      const confirmed = await ask(
        `Version ${update.version} is available (current: ${update.currentVersion}). Download and install now?`,
        { title: 'Update Available', type: 'info' }
      )
      if (confirmed) {
        await update.downloadAndInstall()
        await relaunch()
      }
    }
  } catch (err) {
    console.error('[updater]', err)
  }
}
