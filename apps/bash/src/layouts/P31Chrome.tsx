import { useEffect, useState } from 'react';
import { SovereigntyStrip, CompanionPanel } from '@p31/ui/chrome';
import { NotificationContainer } from '@p31/ui/alerts';
import { trackComponentUsage } from '@p31/ui';
import '@p31/ui/chrome.css';
import '@p31/ui/spoon-orbit.css';

export default function BashChrome() {
  const [open, setOpen] = useState(false);

  useEffect(() => { trackComponentUsage('P31Chrome', 'bash'); }, []);

  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    const triggers = document.querySelectorAll('[data-companion-trigger]');
    triggers.forEach((el) => el.addEventListener('click', handler));
    return () => {
      document.querySelectorAll('[data-companion-trigger]').forEach((el) => el.removeEventListener('click', handler));
    };
  }, []);

  return (
    <>
      <SovereigntyStrip appName="BASH" noPassportMessage="Your session is local and private." />
      <CompanionPanel open={open} onClose={() => setOpen(false)} />
      <NotificationContainer />
    </>
  );
}
