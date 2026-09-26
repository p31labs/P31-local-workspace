/**
 * Maps a StatusBadge `status` (online/offline/busy/away) to the
 * corresponding recipe CSS class used in recipes.css.
 */
export function badgeClassForStatus(status: 'online' | 'offline' | 'busy' | 'away'): string {
  switch (status) {
    case 'online':
      return 'badge-success';
    case 'offline':
      return 'badge-error';
    case 'busy':
      return 'badge-warning';
    case 'away':
      return 'badge-info';
    default:
      return 'badge';
  }
}
