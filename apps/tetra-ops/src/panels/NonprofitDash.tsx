/**
 * @file NonprofitDash — Combined nonprofit management tab (Donors, Grants, Volunteers, Campaigns, Ledger).
 */

import { useState } from 'react';
import DonorPanel from './DonorPanel';
import GrantPanel from './GrantPanel';
import VolunteerPanel from './VolunteerPanel';
import CampaignPanel from './CampaignPanel';
import LedgerPanel from './LedgerPanel';

const TABS = [
  { id: 'donors', label: 'Donors', Component: DonorPanel },
  { id: 'grants', label: 'Grants', Component: GrantPanel },
  { id: 'volunteers', label: 'Volunteers', Component: VolunteerPanel },
  { id: 'campaigns', label: 'Campaigns', Component: CampaignPanel },
  { id: 'ledger', label: 'Ledger', Component: LedgerPanel },
] as const;

export function NonprofitDash() {
  const [tab, setTab] = useState<string>('donors');
  const Active = TABS.find(t => t.id === tab)?.Component || DonorPanel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 10px', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#fbbf24' : 'transparent'}`,
            background: 'transparent', color: tab === t.id ? '#fbbf24' : 'rgba(240,242,245,0.4)', fontSize: 10, cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}

export default NonprofitDash;
