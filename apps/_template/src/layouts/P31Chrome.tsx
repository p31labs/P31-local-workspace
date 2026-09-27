/**
 * @file P31Chrome — Astro island that mounts the shared P31 sovereign chrome
 * (SovereigntyStrip + Companion + Notifications) into phosphorus31. Client-only.
 * Companion is opened by the home-page hero center dot ([data-companion-trigger]).
 */

import { useEffect, useState } from 'react';
import { SovereigntyStrip, CompanionPanel } from '@p31ca/ui/chrome';
import { NotificationContainer } from '@p31ca/ui/alerts';
import { trackComponentUsage } from '@p31ca/ui';
import '@p31ca/ui/chrome.css';
import '@p31ca/ui/spoon-orbit.css';

export default function P31Chrome() {
  const [open, setOpen] = useState(false);

  useEffect(() => { trackComponentUsage('P31Chrome', 'phosphorus31'); }, []);

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
      <SovereigntyStrip appName="P31" noPassportMessage="No passport yet — your identity stays yours." />
      <CompanionPanel open={open} onClose={() => setOpen(false)} />
      <NotificationContainer />
    </>
  );
}
