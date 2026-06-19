const SUBSCRIPTION_KEY = 'phos-push-subscription';
const PERMISSION_KEY = 'phos-push-permission-asked';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const permission = await Notification.requestPermission();
  localStorage.setItem(PERMISSION_KEY, 'true');
  return permission;
}

export async function getVapidPublicKey(): Promise<string> {
  const key = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY as string | undefined;
  if (key) return key;
  const stored = localStorage.getItem('phos-vapid-public-key');
  if (stored) return stored;
  return '';
}

export async function subscribeToPush(
  serverEndpoint?: string
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await requestPermission();
  if (permission !== 'granted') return null;

  const applicationServerKey = await getVapidPublicKey();
  if (!applicationServerKey) return null;

  const reg = await navigator.serviceWorker.ready;
  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
    });
  }

  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription.toJSON()));

  if (serverEndpoint) {
    try {
      await fetch(serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch {
      // Server not available yet — subscription saved locally
    }
  }

  return subscription;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return false;
  const result = await subscription.unsubscribe();
  localStorage.removeItem(SUBSCRIPTION_KEY);
  return result;
}

export function getStoredSubscription(): PushSubscriptionJSON | null {
  const stored = localStorage.getItem(SUBSCRIPTION_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function hasAskedForPermission(): boolean {
  return localStorage.getItem(PERMISSION_KEY) === 'true';
}

// Utility: convert base64url string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}
