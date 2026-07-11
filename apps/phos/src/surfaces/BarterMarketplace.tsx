import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { identityStore } from '../store/identity';
import { trustGraph } from '../lib/trustGraph';
import { barterEngine, type BarterListing } from '../lib/barterEngine';
import { createContract, type ContractRecord } from '../lib/api/contracts';

const CATEGORIES = ['FAMILY', 'EDUCATION', 'MEDICAL', 'LOGISTICS', 'ENTERTAINMENT', 'OTHER'];

export function BarterMarketplace() {
  const identity = useSyncExternalStore(
    (cb) => identityStore.subscribe(cb),
    () => identityStore.get(),
    () => ({ did: '', displayName: '', publicKey: '', isRegistered: 'false', joinedAt: '', keysGenerated: 'false' }),
  );
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'my'>('list');
  const [listings, setListings] = useState<BarterListing[]>([]);
  const [trustProfile, setTrustProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offeredItem, setOfferedItem] = useState('');
  const [offeredQuantity, setOfferedQuantity] = useState(1);
  const [requestedItem, setRequestedItem] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [contracts, setContracts] = useState<ContractRecord[]>([]);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      try {
        setListings(barterEngine.getActiveListings());
        if (identity.did) {
          const profile = trustGraph.getTrustProfile(identity.did);
          setTrustProfile(profile);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load barter data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [identity.did]);

  const handleAcceptOffer = useCallback(async (offerId: string, listing: BarterListing) => {
    if (!identity.did) {
      setError('Please complete the Abdication Ritual first');
      return;
    }

    try {
      const contract = await createContract({
        partyADid: listing.offeredBy,
        partyBDid: identity.did,
        type: 'ROCCA',
        title: `Barter: ${listing.offeredItem} ↔ ${listing.requestedItem}`,
        description: `Barter agreement for ${listing.offeredQuantity}x ${listing.offeredItem} in exchange for ${listing.requestedQuantity}x ${listing.requestedItem}`,
        terms: [
          { type: 'exchange', from: listing.offeredBy, to: identity.did, item: listing.offeredItem, quantity: listing.offeredQuantity },
          { type: 'exchange', from: identity.did, to: listing.offeredBy, item: listing.requestedItem, quantity: listing.requestedQuantity },
        ],
        stakes: [],
        metadata: { category: listing.category, location: listing.location, listingId: listing.id },
      });

      setContracts([...contracts, contract]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create barter contract');
    }
  }, [identity.did, contracts]);

  const handleCreateListing = useCallback(() => {
    if (!identity.did) {
      setError('Please complete the Abdication Ritual first');
      return;
    }
    if (!offeredItem || !requestedItem || offeredQuantity < 1 || requestedQuantity < 1) {
      setError('Please fill out all fields');
      return;
    }

    const listing = barterEngine.createListing(
      identity.did,
      offeredItem,
      offeredQuantity,
      requestedItem,
      requestedQuantity,
      location || 'Global',
      category
    );
    setListings([...listings, listing]);
    setOfferedItem('');
    setOfferedQuantity(1);
    setRequestedItem('');
    setRequestedQuantity(1);
    setLocation('');
    setCategory('OTHER');
    setActiveTab('list');
  }, [identity.did, offeredItem, offeredQuantity, requestedItem, requestedQuantity, location, category, listings]);

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-shimmer">Barter Marketplace</h1>
          <p className="text-xs text-white/40 font-mono mt-1">Trust-based exchange without banks or fiat currency</p>
        </div>
        {trustProfile && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="text-white/40">Trust Score</div>
              <div className="text-phos-primary font-mono">{(trustProfile.trustScore * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-white/40">Capacity</div>
              <div className="text-phos-primary font-mono">{trustProfile.capacity.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-white/40">Reputation</div>
              <div className="text-phos-primary font-mono">{trustProfile.reputation}/100</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['list', 'create', 'my'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
              activeTab === tab
                ? 'bg-white/10 text-white/80 border border-white/10'
                : 'text-white/70 hover:text-white/90'
            }`}
          >
            {tab === 'list' ? 'Browse' : tab === 'create' ? 'Create Listing' : 'My Listings'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 glass-wash rounded-xl border border-red-500/30 text-xs text-red-400/80">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-phos-primary/30 border-t-phos-primary rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <p className="text-sm font-light">No active barter listings.</p>
              <p className="text-xs opacity-50 mt-1">Be the first to list something.</p>
            </div>
          ) : (
            listings.map(listing => (
              <div key={listing.id} className="p-4 glass-quiet rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans text-white/80">
                        {listing.offeredQuantity}x {listing.offeredItem}
                      </span>
                      <span className="text-xs text-white/70">⟷</span>
                      <span className="text-sm font-sans text-white/80">
                        {listing.requestedQuantity}x {listing.requestedItem}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-2 text-[10px] text-white/70 font-mono">
                      <span>{listing.location}</span>
                      <span>·</span>
                      <span>{listing.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => listing.offeredBy !== identity.did && handleAcceptOffer(listing.id, listing)}
                    disabled={listing.offeredBy === identity.did}
                    className="px-3 py-1 rounded-lg text-[10px] bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-40"
                  >
                    {listing.offeredBy === identity.did ? 'Your listing' : 'Make Offer'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-sans text-white/70">Create Barter Listing</h2>
            <p className="text-xs text-white/70 font-light">List something you have to offer. Trust capacity determines your limit.</p>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={offeredItem}
                onChange={(e) => setOfferedItem(e.target.value)}
                placeholder="Item to Offer"
                className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
              />
              <input
                type="number"
                value={offeredQuantity}
                onChange={(e) => setOfferedQuantity(Number(e.target.value))}
                placeholder="Quantity"
                min={1}
                className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={requestedItem}
                onChange={(e) => setRequestedItem(e.target.value)}
                placeholder="Item Requested"
                className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
              />
              <input
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(Number(e.target.value))}
                placeholder="Quantity"
                min={1}
                className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
              />
            </div>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/60"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <button
              onClick={handleCreateListing}
              disabled={!offeredItem || !requestedItem}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-sans text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              List for Barter
            </button>

            {trustProfile && (
              <div className="text-xs text-white/70 font-light text-center">
                Your trust capacity: {trustProfile.capacity.toLocaleString()} units
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'my' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          <p className="text-xs text-white/70 font-light mb-4">Your active barter listings.</p>
          {listings.filter(l => l.offeredBy === identity.did).length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <p className="text-sm font-light">You haven't listed anything yet.</p>
            </div>
          ) : (
            listings
              .filter(l => l.offeredBy === identity.did)
              .map(listing => (
                <div key={listing.id} className="p-4 glass-quiet rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-white/80">
                      {listing.offeredQuantity}x {listing.offeredItem}
                    </span>
                    <span className="text-xs text-white/70">⟷</span>
                    <span className="text-sm font-sans text-white/80">
                      {listing.requestedQuantity}x {listing.requestedItem}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-white/70 font-mono">
                    <span>{listing.status}</span>
                    <span>·</span>
                    <span>{listing.location}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
