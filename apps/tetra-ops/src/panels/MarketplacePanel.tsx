import { useState, useEffect } from 'react';

const MARKETPLACE_URL = 'https://gateway.p31ca.org/api/marketplace';

interface Listing {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  creator_did: string;
  created_at: number;
}

export function MarketplacePanel() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [pubType, setPubType] = useState('template');
  const [pubName, setPubName] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubPrice, setPubPrice] = useState('1');
  const [pubDid, setPubDid] = useState('');

  const fetchListings = () => {
    setLoading(true);
    fetch(`${MARKETPLACE_URL}/listings`)
      .then(r => r.json())
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const purchase = async (id: string, price: number) => {
    const buyer = prompt('Enter your DID to purchase:');
    if (!buyer) return;
    try {
      const res = await fetch(`${MARKETPLACE_URL}/purchase`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, buyer_did: buyer }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Purchased! Content: ${JSON.stringify(data.content)}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const publish = async () => {
    if (!pubName || !pubDid) return alert('Name and DID required');
    try {
      const res = await fetch(`${MARKETPLACE_URL}/listings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pubType, name: pubName, description: pubDesc, price: Number(pubPrice) || 1, creator_did: pubDid, content: { name: pubName } }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Published!');
        setShowPublish(false);
        setPubName('');
        setPubDesc('');
        fetchListings();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, maxHeight: '60vh', overflow: 'auto' }} data-mcp-tool="marketplacePanel" data-mcp-state={showPublish ? 'publishing' : (listings.length > 0 ? 'hasListings' : 'empty')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Marketplace ({listings.length})
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={fetchListings} data-mcp-tool="refreshListings" data-mcp-type="action" data-mcp-target="marketplace-refresh" style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(240,242,245,0.3)', fontSize: 9, cursor: 'pointer' }}>↻</button>
          <button onClick={() => setShowPublish(p => !p)} data-mcp-tool="togglePublish" data-mcp-type="action" data-mcp-target="marketplace-publish-toggle" data-mcp-state={showPublish ? 'open' : 'closed'} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 9, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {showPublish ? '✕' : '+ Publish'}
          </button>
        </div>
      </div>

      {showPublish && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.15)', background: 'rgba(52,211,153,0.03)' }}>
          <div style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>Publish Listing</div>
          <select value={pubType} onChange={e => setPubType(e.target.value)} data-mcp-tool="setListingType" data-mcp-type="input" data-mcp-target="listing-type" style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit' }}>
            <option value="template">Template</option>
            <option value="block">Block Preset</option>
            <option value="world">Roblox World</option>
          </select>
          <input value={pubName} onChange={e => setPubName(e.target.value)} placeholder="Name" data-mcp-tool="publishListing" data-mcp-type="input" data-mcp-target="publish-name" style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
          <input value={pubDesc} onChange={e => setPubDesc(e.target.value)} placeholder="Description" data-mcp-tool="publishListing" data-mcp-type="input" data-mcp-target="publish-desc" style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input value={pubPrice} onChange={e => setPubPrice(e.target.value)} placeholder="Price (LOVE)" type="number" min="1" data-mcp-tool="publishListing" data-mcp-type="input" data-mcp-target="publish-price" style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
            <span style={{ fontSize: 9, color: '#fbbf24' }}>♥ LOVE</span>
          </div>
          <input value={pubDid} onChange={e => setPubDid(e.target.value)} placeholder="Your DID" data-mcp-tool="publishListing" data-mcp-type="input" data-mcp-target="publish-did" style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={publish} data-mcp-tool="publishListing" data-mcp-type="action" data-mcp-target="publish-submit" style={{ padding: '6px 0', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Publish</button>
        </div>
      )}

      {loading && <div style={{ padding: 16, textAlign: 'center', color: 'rgba(240,242,245,0.2)', fontSize: 10 }}>Loading...</div>}

      {!loading && listings.length === 0 && (
        <div style={{ padding: 16, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'rgba(240,242,245,0.2)', fontSize: 10 }}>
          No listings yet. Be the first to publish!
        </div>
      )}

      {listings.map(l => (
        <div key={l.id} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#f0f2f5', fontSize: 11 }}>{l.name}</div>
              <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.25)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{l.type} · {l.creator_did?.slice(0, 12)}…</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 10 }}>♥ {l.price}</span>
              <button onClick={() => purchase(l.id, l.price)} data-mcp-tool="purchaseListing" data-mcp-type="action" data-mcp-target={`buy-${l.id}`} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.06)', color: '#34d399', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>Buy</button>
            </div>
          </div>
          {l.description && <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)' }}>{l.description}</div>}
        </div>
      ))}
    </div>
  );
}

export default MarketplacePanel;
