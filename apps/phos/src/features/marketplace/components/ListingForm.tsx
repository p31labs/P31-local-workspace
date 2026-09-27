import { useState } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { usePassport } from '@p31ca/ui/passport';

interface ListingFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ListingForm({ onSubmit, onCancel }: ListingFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [condition, setCondition] = useState<'new' | 'like-new' | 'good' | 'fair' | 'poor'>('good');
  const [priceLove, setPriceLove] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [acceptsBarter, setAcceptsBarter] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const { passport } = usePassport();

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages(prev => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport?.did || !title.trim()) return;
    onSubmit({
      sellerDid: passport.did,
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      priceLove: parseInt(priceLove) || 0,
      priceUsd: parseInt(priceUsd) || 0,
      acceptsBarter,
      images,
    });
  };

  const categories = [
    'Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Toys', 'Other'
  ];

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4">List an Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-cloud/40 block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            placeholder="What are you listing?"
            required
          />
        </div>

        <div>
          <label className="text-xs text-cloud/40 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            rows={3}
            placeholder="Describe the item's condition, features, and history..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-cloud/40 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            >
              {categories.map(c => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-cloud/40 block mb-1">Condition</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value as any)}
              className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-cloud/40 block mb-1">Price (LOVE credits)</label>
            <input
              type="number"
              value={priceLove}
              onChange={e => setPriceLove(e.target.value)}
              className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
              min="0"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-cloud/40 block mb-1">Price (USD cents)</label>
            <input
              type="number"
              value={priceUsd}
              onChange={e => setPriceUsd(e.target.value)}
              className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-cloud/40 block mb-1">Images (R2 / IPFS URLs)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="flex-1 bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
              placeholder="https://..."
            />
            <GlowButton color="cyan" type="button" onClick={handleAddImage}>Add</GlowButton>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((url, i) => (
                <span key={i} className="text-xs bg-void-surface/40 border border-white/10 rounded px-2 py-1 text-cloud/60">
                  {url.slice(0, 30)}...
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="acceptsBarter"
            checked={acceptsBarter}
            onChange={e => setAcceptsBarter(e.target.checked)}
            className="rounded border-white/20"
          />
          <label htmlFor="acceptsBarter" className="text-sm text-cloud/60">
            I accept barter/trade offers
          </label>
        </div>

        <div className="flex gap-2">
          <GlowButton color="cyan" type="submit" className="flex-1">
            Create Listing
          </GlowButton>
          <GlowButton variant="ghost" onClick={onCancel}>Cancel</GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}
