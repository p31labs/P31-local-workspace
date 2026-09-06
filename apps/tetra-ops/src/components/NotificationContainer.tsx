import { useNotificationStore } from '../state/notificationStore';
import { NotificationToast } from './NotificationToast';

export function NotificationContainer() {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        top: 'calc(var(--tetra-hdr-h) + 10px)',
        right: 12,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {notifications.map((n) => (
        <div key={n.id} style={{ pointerEvents: 'auto' }}>
          <NotificationToast n={n} />
        </div>
      ))}
    </div>
  );
}
