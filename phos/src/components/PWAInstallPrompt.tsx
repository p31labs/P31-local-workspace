import { useEffect, useRef, useState } from 'react';

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'pwa-install': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'install-description'?: string;
          'manual-apple'?: string;
          'manual-chrome'?: string;
          'disable-chrome'?: string;
          'disable-install-description'?: string;
          'manifest-url'?: string;
          name?: string;
          description?: string;
          icon?: string;
          ref?: React.Ref<HTMLElement>;
        },
        HTMLElement
      >;
    }
  }
}

export function PWAInstallPrompt() {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem('phos-pwa-dismissed') === 'true';
    if (dismissed) return;
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    import('@khmyznikov/pwa-install');
  }, [ready]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => {
      localStorage.setItem('phos-pwa-dismissed', 'true');
      setReady(false);
    };
    el.addEventListener('pwa-install-success-event', close);
    el.addEventListener('pwa-install-fail-event', close);
    el.addEventListener('pwa-user-choice-result-event', close);
    return () => {
      el.removeEventListener('pwa-install-success-event', close);
      el.removeEventListener('pwa-install-fail-event', close);
      el.removeEventListener('pwa-user-choice-result-event', close);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <pwa-install
      ref={ref}
      install-description="Install PHOS for offline access and quick launching from your home screen."
    />
  );
}
