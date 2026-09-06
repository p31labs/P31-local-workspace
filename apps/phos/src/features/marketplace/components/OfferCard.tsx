import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface OfferCardProps {
  offer: {
    id: string;
    listingId: string;
    buyerDid: string;
    sellerDid: string;
    offerLove: number;
    offerUsd: number;
    offerItems: string[];
    status: string;
    createdAt: number;
  };
  onAccept?: () => void;
  onReject?: () => void;
}

export function OfferCard({ offer, onAccept, onReject }: OfferCardProps) {
  const statusColors = {
    pending: 'bg-quantum-amber/10 text-quantum-amber',
    accepted: 'bg-quantum-green/10 text-quantum-green',
    rejected: 'bg-red-400/10 text-red-400',
    escrow: 'bg-quantum-cyan/10 text-quantum-cyan',
    completed: 'bg-quantum-green/10 text-quantum-green',
    disputed: 'bg-red-400/10 text-red-400',
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-cloud/40">Offer #{offer.id.slice(0, 8)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[offer.status as keyof typeof statusColors] || statusColors.pending}`}>
              {offer.status}
            </span>
          </div>
          <p className="text-xs text-cloud/50">
            From: {offer.buyerDid.slice(0, 16)}...{offer.buyerDid.slice(-4)}
          </p>
          <p className="text-xs text-cloud/30">
            {new Date(offer.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-quantum-rose font-mono-tech">
            {offer.offerLove > 0 && `${offer.offerLove} LOVE `}
            {offer.offerUsd > 0 && `$${(offer.offerUsd / 100).toFixed(2)}`}
          </p>
          {offer.offerItems.length > 0 && (
            <p className="text-xs text-cloud/30">+ {offer.offerItems.length} items</p>
          )}
        </div>
      </div>
      {offer.status === 'pending' && onAccept && onReject && (
        <div className="flex gap-2 mt-3">
          <GlowButton color="cyan" size="sm" onClick={onAccept} className="flex-1">
            Accept
          </GlowButton>
          <GlowButton color="ghost" size="sm" onClick={onReject} className="flex-1">
            Reject
          </GlowButton>
        </div>
      )}
    </GlassCard>
  );
}
