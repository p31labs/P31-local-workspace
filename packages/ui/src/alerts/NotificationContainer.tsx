/**
 * @file NotificationContainer — Fixed top-right stack of toasts.
 * Mount once near the app root. Hides in crisis mode (`.ui-chrome`).
 */

import { useAlertStore } from './alertStore';
import { NotificationToast } from './NotificationToast';

export function NotificationContainer() {
  const alerts = useAlertStore((s) => s.alerts);
  return (
    <div
      className="ui-chrome fixed top-16 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      {alerts.map((a) => (
        <NotificationToast key={a.id} alert={a} />
      ))}
    </div>
  );
}
