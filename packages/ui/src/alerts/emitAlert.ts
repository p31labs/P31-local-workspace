/**
 * @file emitAlert — Imperative helper (works outside React render).
 */

import { useAlertStore, type AlertType } from './alertStore';

export function emitAlert(message: string, type: AlertType = 'info', duration = 5000): string {
  return useAlertStore.getState().add(message, type, duration);
}
