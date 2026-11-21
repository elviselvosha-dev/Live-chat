import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { SmartMedia } from './SmartMedia';
import { formatRelativeTime, readFileAsDataUrl } from '../utils/format';
import type { MarketplaceCategory, MarketplaceItem } from '../types';

const CATEGORIES: (MarketplaceCategory | 'Saved')[] = [
  'All',
  'Vehicles',
  'Electronics',
  'Home & Garden',
  'Furniture',
  'Apparel',
  'Saved',
];

export const MarketplaceView: React.FC = () => {
  const {
    listings,
    currentUser,
    freeMode,
    recordDataUnlocked,
    getUserById,
    openUserProfile,
    openChatWithUser,
    toggleFollow,
    createListing,
    toggleSaveListing,
    updateListingStatus,
  } = useSocial();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | 'Saved'>('All');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);

  // Sell form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<MarketplaceItem['condition']>('Like New');
  const [category, setCategory] = useState<MarketplaceItem['category']>('Electronics');
  const [location, setLocation] = useState(currentUser?.location || 'Oakwood District');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [publishing, setPublishing] = useState(false);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCategory === 'Saved') {
        if (!currentUser || !item.savedBy.includes(currentUser.id)) return false;
      } else if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [listings, selectedCategory, query, currentUser]);

  // Keep selectedItem synced with latest server state
  const activeDetailItem = selectedItem
    ? listings.find((l) => l.id === selectedItem.id) || selectedItem
    : null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setImage(dataUrl);
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!title.trim() || Number.isNaN(numericPrice)) return;
    setPublishing(true);
    try {
      await createListing({
        title,
        price: numericPrice,
        condition,
        category,
        location,
        description,
        image,
      });
      setTitle('');
      setPrice('');
      setDescription('');
      setImage(undefined);
      setShowSellModal(false);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Marketplace Header & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Marketplace</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Local pickup within 10 km of {currentUser?.location || 'your area'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSellModal(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#166FE5] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Sell Item</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bikes, cameras, furniture, neighborhood..."
            className="w-full min-h-[42px] rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No matching items nearby</p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing your search filter or list an item for sale.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredListings.map((item) => {
            const seller = getUserById(item.sellerId);
            const isSaved = Boolean(currentUser && item.savedBy.includes(currentUser.id));

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedItem(item);
                }}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors cursor-pointer flex flex-col text-left"
              >
                <div className="relative">
                  <SmartMedia
                    src={item.image}
                    alt={item.title}
                    sizeKb={item.imageSizeKb}
                    freeMode={freeMode}
                    onUnlockCost={recordDataUnlocked}
                    aspectClass="aspect-[4/3]"
                  />
                  {item.status !== 'available' && (
                    <span
                      className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                        item.status === 'sold'
                          ? 'bg-slate-900 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveListing(item.id);
                    }}
                    className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                      isSaved
                        ? 'bg-[#1877F2] text-white'
                        : 'bg-black/45 text-white hover:bg-black/65'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                  </button>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        {item.currency}
                        {item.price.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {item.condition}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2 leading-snug">
                      {item.title}
                    </h2>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate">
                      {item.location} · {item.distanceKm} km
                    </span>
                    <span className="shrink-0 ml-2">{seller?.name.split(' ')[0] || 'Seller'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Detail Modal / Bottom Sheet */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 truncate pr-4">
                {activeDetailItem.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close listing details"
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SmartMedia
                src={activeDetailItem.image}
                alt={activeDetailItem.title}
                sizeKb={activeDetailItem.imageSizeKb}
                freeMode={freeMode}
                onUnlockCost={recordDataUnlocked}
                aspectClass="aspect-[4/3]"
              />

              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {activeDetailItem.currency}
                      {activeDetailItem.price.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {activeDetailItem.status === 'available'
                        ? 'Available for local pickup'
                        : activeDetailItem.status === 'pending'
                          ? 'Pickup reserved'
                          : 'Sold'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {activeDetailItem.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeDetailItem.category} · {activeDetailItem.condition} ·{' '}
                    {activeDetailItem.location} ({activeDetailItem.distanceKm} km away) · Listed{' '}
                    {formatRelativeTime(activeDetailItem.createdAt)}
                  </p>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeDetailItem.description || 'Local neighborhood listing in good condition.'}
                </p>

                {/* Seller Card */}
                {(() => {
                  const seller = getUserById(activeDetailItem.sellerId);
                  const isSellerMe = seller?.id === currentUser?.id;
                  const isFollowing = Boolean(
                    seller && currentUser?.following.includes(seller.id)
                  );
                  if (!seller) return null;
                  return (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItem(null);
                          openUserProfile(seller.id);
                        }}
                        className="flex items-center gap-3 min-w-0 text-left"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                          {!freeMode ? (
                            <img
                              src={seller.avatar}
                              alt={seller.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                              {seller.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{seller.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {seller.followers.length} followers · {seller.location}
                          </p>
                        </div>
                      </button>

                      {!isSellerMe && (
                        <button
                          type="button"
                          onClick={() => toggleFollow(seller.id)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                            isFollowing
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {isFollowing ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sticky Sheet Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-2.5">
              {activeDetailItem.sellerId === currentUser?.id ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      updateListingStatus(
                        activeDetailItem.id,
                        activeDetailItem.status === 'sold' ? 'available' : 'sold'
                      )
                    }
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    {activeDetailItem.status === 'sold' ? 'Mark Available' : 'Mark as Sold'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const item = activeDetailItem;
                      setSelectedItem(null);
                      openChatWithUser(item.sellerId, item);
                    }}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message Seller</span>
                  </button>

                  <button
                    type="button"
                    disabled={activeDetailItem.status !== 'available'}
                    onClick={() => updateListingStatus(activeDetailItem.id, 'pending')}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1877F2] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {activeDetailItem.status === 'available'
                        ? 'Reserve to Buy'
                        : activeDetailItem.status === 'pending'
                          ? 'Reserved'
                          : 'Sold'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sell Item Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handlePublishListing}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">List Local Item for Sale</h2>
              <button
                type="button"
                onClick={() => setShowSellModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Oak Mid-Century Coffee Table"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="120"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-mono focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as MarketplaceItem['condition'])}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:border-[#1877F2]"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MarketplaceItem['category'])}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:border-[#1877F2]"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home & Garden">Home &amp; Garden</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#1877F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pickup details, dimensions, or included accessories..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSellModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing || !title.trim() || !price}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#166FE5] disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
