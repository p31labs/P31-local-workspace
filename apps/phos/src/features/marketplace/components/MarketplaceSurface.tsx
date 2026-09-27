import { useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { usePassport } from '@p31ca/ui/passport';
import { TrustBadge } from './TrustBadge';

// ─── Types ────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  sellerDid: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  priceLove: number;
  priceUsd: number;
  acceptsBarter: boolean;
  images: string[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  trustTier: 'basic' | 'trusted' | 'high';
  createdAt: number;
  expiresAt: number;
}

interface Offer {
  id: string;
  listingId: string;
  buyerDid: string;
  sellerDid: string;
  offerLove: number;
  offerUsd: number;
  offerItems: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'escrow' | 'completed' | 'disputed';
  escrowId: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────

function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('https://gateway.p31ca.org/api/marketplace/listings')
      .then(res => res.ok ? res.json() : { listings: [] })
      .then((data: any) => { setListings(data.listings || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { listings, loading };
}

function useLoveBalance(did: string | undefined) {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!did) { setBalance(null); return; }
    fetch(`https://gateway.p31ca.org/api/love/balance/${encodeURIComponent(did)}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: any) => setBalance(data?.total_earned ?? null))
      .catch(() => setBalance(null));
  }, [did]);
  return balance;
}

// ─── Components ───────────────────────────────────────────────────────

function ListingCard({ listing, onSelect }: { listing: Listing; onSelect: (l: Listing) => void }) {
  const conditionColors = {
    'new': 'text-quantum-green', 'like-new': 'text-quantum-cyan', 'good': 'text-quantum-amber',
    'fair': 'text-cloud/60', 'poor': 'text-red-400'
  };

  return (
    <GlassCard className="p-4 cursor-pointer hover:border-quantum-cyan/20 transition-colors" onClick={() => onSelect(listing)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-ink truncate">{listing.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${conditionColors[listing.condition]}`}>
              {listing.condition}
            </span>
            <TrustBadge tier={listing.trustTier} size="sm" />
          </div>
          <p className="text-xs text-cloud/50 mb-1 line-clamp-2">{listing.description}</p>
          <p className="text-xs text-cloud/30">{listing.category} · {new Date(listing.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <p className="text-lg font-bold text-quantum-rose font-mono-tech">{listing.priceLove}</p>
          <p className="text-xs text-cloud/30">LOVE</p>
          {listing.priceUsd > 0 && (
            <p className="text-xs text-cloud/20">${(listing.priceUsd / 100).toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-lg ${listing.acceptsBarter ? 'bg-quantum-violet/10 text-quantum-violet' : 'bg-white/5 text-cloud/40'}`}>
          {listing.acceptsBarter ? 'Accepts barter' : 'Cash only'}
        </span>
        <GlowButton color="cyan" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(listing); }}>
          View
        </GlowButton>
      </div>
    </GlassCard>
  );
}

function ListingDetail({ listing, onBack }: { listing: Listing; onBack: () => void }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const { passport } = usePassport();
  const loveBalance = useLoveBalance(passport?.did);

  useEffect(() => {
    if (listing.id) {
      fetch(`https://gateway.p31ca.org/api/marketplace/offers?listingId=${listing.id}`)
        .then(res => res.ok ? res.json() : { offers: [] })
        .then((data: any) => setOffers(data.offers || []))
        .catch(() => setOffers([]));
    }
  }, [listing.id]);

  const handleMakeOffer = async (offerData: any) => {
    const res = await fetch('https://gateway.p31ca.org/api/marketplace/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...offerData, listingId: listing.id, buyerDid: passport?.did }),
    });
    if (res.ok) {
      setShowOfferForm(false);
      // Refresh offers
      const data = await res.json();
      setOffers(prev => [...prev, { ...data, status: 'pending' }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <GlowButton color="cyan" variant="ghost" onClick={onBack}>← Back to Marketplace</GlowButton>

      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-ink mb-1">{listing.title}</h1>
            <p className="text-sm text-cloud/50">{listing.description}</p>
          </div>
          <TrustBadge tier={listing.trustTier} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-cloud/40 mb-1">Price</p>
            <p className="text-2xl font-bold text-quantum-rose font-mono-tech">{listing.priceLove} LOVE</p>
            {listing.priceUsd > 0 && (
              <p className="text-sm text-cloud/30">${(listing.priceUsd / 100).toFixed(2)} USD</p>
            )}
          </div>
          <div>
            <p className="text-xs text-cloud/40 mb-1">Condition</p>
            <p className="text-sm font-medium text-ink capitalize">{listing.condition.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-3 py-1 rounded-lg ${listing.acceptsBarter ? 'bg-quantum-violet/10 text-quantum-violet' : 'bg-white/5 text-cloud/40'}`}>
            {listing.acceptsBarter ? 'Accepts barter' : 'Cash only'}
          </span>
          <span className="text-xs text-cloud/30">Category: {listing.category}</span>
        </div>

        {passport?.did && listing.sellerDid !== passport.did && (
          <GlowButton
            color="violet"
            className="w-full mb-4"
            onClick={() => setShowOfferForm(!showOfferForm)}
            disabled={loveBalance === null || loveBalance < listing.priceLove}
          >
            {loveBalance === null ? 'Check balance...' : loveBalance < listing.priceLove ? 'Insufficient LOVE' : 'Make Offer'}
          </GlowButton>
        )}

        {showOfferForm && (
          <OfferForm
            listing={listing}
            onSubmit={handleMakeOffer}
            onCancel={() => setShowOfferForm(false)}
          />
        )}
      </GlassCard>

      {offers.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-3">Offers ({offers.length})</h2>
          <div className="space-y-2">
            {offers.map(offer => (
              <div key={offer.id} className="p-3 rounded-xl bg-void-surface/40 border border-white/[0.06]">
                <div className="flex justify-between text-xs">
                  <span className="text-cloud/50">From: {offer.buyerDid.slice(0, 12)}...</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    offer.status === 'pending' ? 'bg-quantum-amber/10 text-quantum-amber' :
                    offer.status === 'accepted' ? 'bg-quantum-green/10 text-quantum-green' :
                    'bg-red-400/10 text-red-400'
                  }`}>
                    {offer.status}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-cloud/60">
                  {offer.offerLove > 0 && <span>{offer.offerLove} LOVE</span>}
                  {offer.offerUsd > 0 && <span>${(offer.offerUsd / 100).toFixed(2)}</span>}
                  {offer.offerItems.length > 0 && <span>+ {offer.offerItems.length} items</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function OfferForm({ listing, onSubmit, onCancel }: { listing: Listing; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [offerLove, setOfferLove] = useState(listing.priceLove.toString());
  const [offerUsd, setOfferUsd] = useState('');
  const [offerItems, setOfferItems] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      offerLove: parseInt(offerLove) || 0,
      offerUsd: parseInt(offerUsd) || 0,
      offerItems: offerItems.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-xl bg-void-surface/40 border border-white/[0.06] space-y-3">
      <h3 className="text-sm font-semibold text-ink">Make an Offer</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-cloud/40 block mb-1">LOVE Credits</label>
          <input
            type="number"
            value={offerLove}
            onChange={e => setOfferLove(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-cloud/40 block mb-1">USD (cents)</label>
          <input
            type="number"
            value={offerUsd}
            onChange={e => setOfferUsd(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            min="0"
            placeholder="0"
          />
        </div>
      </div>
      {listing.acceptsBarter && (
        <div>
          <label className="text-xs text-cloud/40 block mb-1">Items to trade (comma-separated)</label>
          <input
            type="text"
            value={offerItems}
            onChange={e => setOfferItems(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            placeholder="Item 1, Item 2"
          />
        </div>
      )}
      <div className="flex gap-2">
        <GlowButton color="violet" type="submit" className="flex-1">Submit Offer</GlowButton>
        <GlowButton variant="ghost" onClick={onCancel}>Cancel</GlowButton>
      </div>
    </form>
  );
}

// ─── Main Surface ─────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Other'];

export function MarketplaceSurface() {
  const [view, setView] = useState<'browse' | 'detail'>('browse');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [filter, setFilter] = useState('All');
  const { listings, loading } = useListings();
  const { passport } = usePassport();
  const loveBalance = useLoveBalance(passport?.did);

  const filtered = filter === 'All' ? listings : listings.filter(l => l.category === filter);

  if (view === 'detail' && selectedListing) {
    return <ListingDetail listing={selectedListing} onBack={() => { setView('browse'); setSelectedListing(null); }} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="marketplaceSurface" data-mcp-state={filter}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Sovereign Marketplace</h1>
        <p className="text-cloud/50 text-sm">Used goods, barter, and community exchange.</p>
      </GlassCard>

      <GlassCard className="p-4 text-center">
        <p className="text-xs text-cloud/40">Your LOVE Balance</p>
        <p className="text-3xl font-bold text-quantum-rose font-mono-tech">{loveBalance ?? '...'}</p>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                filter === c ? 'border-quantum-cyan/30 text-quantum-cyan bg-quantum-cyan/10' : 'border-white/10 text-cloud/40 hover:border-white/20'
              }`}
              data-mcp-tool="setMarketFilter" data-mcp-target={`market-filter-${c}`} data-mcp-state={filter === c ? 'active' : 'inactive'}
            >
              {c}
            </button>
          ))}
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-quantum-cyan/30 border-t-quantum-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-cloud/40">Loading listings...</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} onSelect={(l) => { setSelectedListing(l); setView('detail'); }} />
          ))}
          {filtered.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-sm text-cloud/40">No listings found in this category.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
