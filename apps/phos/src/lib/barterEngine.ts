/**
 * Sovereign Barter Engine — Trust-Based Exchange
 */

export interface BarterListing {
  id: string;
  offeredBy: string;
  offeredItem: string;
  offeredQuantity: number;
  requestedItem: string;
  requestedQuantity: number;
  location: string;
  category: string;
  status: 'active' | 'pending' | 'fulfilled' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export interface BarterOffer {
  id: string;
  listingId: string;
  offeredBy: string;
  offeredQuantity: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export class BarterEngine {
  private listings: Map<string, BarterListing> = new Map();
  private offers: Map<string, BarterOffer> = new Map();

  createListing(
    offeredBy: string,
    offeredItem: string,
    offeredQuantity: number,
    requestedItem: string,
    requestedQuantity: number,
    location: string,
    category: string
  ): BarterListing {
    const listing: BarterListing = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      offeredBy,
      offeredItem,
      offeredQuantity,
      requestedItem,
      requestedQuantity,
      location,
      category,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    this.listings.set(listing.id, listing);
    return listing;
  }

  makeOffer(listingId: string, offeredBy: string, offeredQuantity: number, message: string): BarterOffer | null {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== 'active') return null;

    const offer: BarterOffer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      listingId,
      offeredBy,
      offeredQuantity,
      message,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.offers.set(offer.id, offer);
    return offer;
  }

  acceptOffer(offerId: string): { success: boolean; contractId?: string } {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'pending') return { success: false };

    const listing = this.listings.get(offer.listingId);
    if (!listing) return { success: false };

    const contractId = `barter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    listing.status = 'pending';
    offer.status = 'accepted';

    return { success: true, contractId };
  }

  getActiveListings(): BarterListing[] {
    const now = Date.now();
    return Array.from(this.listings.values()).filter(l => l.status === 'active' && l.expiresAt > now);
  }

  getListingsByCategory(category: string): BarterListing[] {
    return Array.from(this.listings.values()).filter(l => l.category === category && l.status === 'active');
  }

  getListingsByLocation(location: string): BarterListing[] {
    return Array.from(this.listings.values()).filter(l => l.location === location && l.status === 'active');
  }

  getOffersForListing(listingId: string): BarterOffer[] {
    return Array.from(this.offers.values()).filter(o => o.listingId === listingId && o.status === 'pending');
  }

  getOffersByUser(did: string): BarterOffer[] {
    return Array.from(this.offers.values()).filter(o => o.offeredBy === did);
  }
}

export const barterEngine = new BarterEngine();
