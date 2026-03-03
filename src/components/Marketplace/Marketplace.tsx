'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Navbar from '../Dashboard/Navbar';
import {
  Search, Plus, X, MapPin, Clock, MessageCircle, Heart, ChevronLeft, ChevronRight,
  Upload, Loader2, Trash2, Edit3, MoreHorizontal, Eye,
  Check, Tag, Package, Filter, SlidersHorizontal, Bookmark,
} from 'lucide-react';

/* ──────────── constants ──────────── */
const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🛍️' },
  { value: 'books', label: 'Books', icon: '📚' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'furniture', label: 'Furniture', icon: '🛋️' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚲' },
  { value: 'tickets', label: 'Tickets', icon: '🎟️' },
  { value: 'notes', label: 'Study Notes', icon: '📝' },
  { value: 'services', label: 'Services', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const;

const CONDITIONS = [
  { value: 'new', label: 'Brand New', color: 'bg-emerald-500' },
  { value: 'like-new', label: 'Like New', color: 'bg-sky-500' },
  { value: 'good', label: 'Good', color: 'bg-amber-500' },
  { value: 'fair', label: 'Fair', color: 'bg-orange-500' },
  { value: 'poor', label: 'Poor', color: 'bg-red-500' },
] as const;

/* ──────────── types ──────────── */
interface Seller {
  _id: string;
  name?: string;
  username?: string;
  profilePicture?: string;
  college?: { name?: string };
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isNegotiable?: boolean;
  condition: string;
  images?: string[];
  meetupLocations?: string[];
  status?: string;
  isSaved?: boolean;
  isOwner?: boolean;
  seller?: Seller;
  views?: number;
  createdAt: string;
}

interface Filters {
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  search: string;
  sort: string;
}

/* ──────────── helpers ──────────── */
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const getCategoryInfo = (v: string) => CATEGORIES.find(c => c.value === v) || CATEGORIES[0];
const getConditionInfo = (v: string) => CONDITIONS.find(c => c.value === v) || CONDITIONS[2];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/* ═══════════════════════════════════════════════════════════════
   IMAGE CAROUSEL — used in detail view
   ═══════════════════════════════════════════════════════════════ */
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  return (
    <div className="relative w-full aspect-square bg-black overflow-hidden group">
      <img
        src={images[idx]}
        alt={`${alt} ${idx + 1}`}
        className="w-full h-full object-contain"
        draggable={false}
      />
      {count > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + count) % count)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % count)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON CARD
   ═══════════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="mp-card animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
      <div className="p-3 space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800/60 rounded w-1/2" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LISTING CARD
   ═══════════════════════════════════════════════════════════════ */
function ListingCard({
  listing, onOpen, onSave, currentUserId,
}: {
  listing: Listing;
  onOpen: () => void;
  onSave: (id: string) => void;
  currentUserId?: string;
}) {
  const hasImage = listing.images && listing.images.length > 0;
  const isSold = listing.status === 'sold';

  return (
    <div className={`mp-card ${isSold ? 'opacity-60' : ''}`} onClick={onOpen}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        {hasImage ? (
          <img
            src={listing.images![0]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {getCategoryInfo(listing.category).icon}
          </div>
        )}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
            1/{listing.images.length}
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wider px-4 py-1 border-2 border-white rounded">SOLD</span>
          </div>
        )}
        {/* Save button */}
        <button
          onClick={e => { e.stopPropagation(); onSave(listing._id); }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 dark:bg-black/60 shadow-sm hover:scale-110 transition-transform"
        >
          {listing.isSaved ? (
            <Bookmark className="w-4 h-4 fill-blue-500 text-blue-500" />
          ) : (
            <Bookmark className="w-4 h-4 text-theme-color" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="mp-price">{listing.price === 0 ? 'Free' : formatPrice(listing.price)}</p>
        <p className="mp-title">{listing.title}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {listing.meetupLocations?.[0] && (
            <span className="mp-meta">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{listing.meetupLocations[0]}</span>
            </span>
          )}
          {!listing.meetupLocations?.[0] && listing.seller?.college?.name && (
            <span className="mp-meta">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{listing.seller.college.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="mp-meta">
            <Clock className="w-3 h-3" />
            {timeAgo(listing.createdAt)}
          </span>
          {listing.views !== undefined && listing.views > 0 && (
            <span className="mp-meta">
              <Eye className="w-3 h-3" />
              {listing.views}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREATE / EDIT FORM MODAL
   ═══════════════════════════════════════════════════════════════ */
function ListingFormModal({
  isEdit,
  initial,
  existingImages,
  onClose,
  onSubmit,
}: {
  isEdit: boolean;
  initial?: Listing;
  existingImages?: string[];
  onClose: () => void;
  onSubmit: (data: any, files: File[]) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(initial?.category || 'other');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [isNegotiable, setIsNegotiable] = useState(initial?.isNegotiable ?? false);
  const [condition, setCondition] = useState(initial?.condition || 'good');
  const [location, setLocation] = useState(initial?.meetupLocations?.[0] || '');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(existingImages || []);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const totalImages = previews.length;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const newFiles = [...files, ...selected];
    setFiles(newFiles);
    selected.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(p => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    const isExisting = existingImages && index < (existingImages.length - (existingImages.length - previews.filter(p => p.startsWith('http')).length));
    // Simply remove from previews; if it's a new file, also remove it
    const existing = previews.filter(p => p.startsWith('http'));
    if (index < existing.length) {
      // It's an existing S3 URL
      setPreviews(p => p.filter((_, i) => i !== index));
    } else {
      // It's a new file preview
      const fileIdx = index - existing.length;
      setFiles(f => f.filter((_, i) => i !== fileIdx));
      setPreviews(p => p.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!price || isNaN(Number(price)) || Number(price) < 0) errs.price = 'Enter a valid price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const existingUrls = previews.filter(p => p.startsWith('http'));
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          price: Number(price),
          isNegotiable,
          condition,
          meetupLocations: location.trim() ? [location.trim()] : [],
          existingImageUrls: existingUrls,
        },
        files,
      );
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mp-modal w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-color/10">
          <h2 className="text-lg font-semibold text-theme-color">{isEdit ? 'Edit Listing' : 'Create Listing'}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-theme-color" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Photos */}
          <div>
            <label className="mp-label">Photos ({totalImages}/5)</label>
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-theme-color/10">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePreview(i)}
                    aria-label="Remove image"
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/60 text-white py-0.5">Cover</span>
                  )}
                </div>
              ))}
              {totalImages < 5 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-5 h-5 text-theme-color-50" />
                  <span className="text-[10px] text-theme-color-50">Add</span>
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" aria-label="Upload photos" />
          </div>

          {/* Title */}
          <div>
            <label className="mp-label">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What are you selling?"
              maxLength={200}
              className={`mp-input ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Price + Negotiable */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mp-label">Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                className={`mp-input ${errors.price ? 'border-red-500' : ''}`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={e => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-blue-500"
                />
                <span className="text-sm text-theme-color">Negotiable</span>
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mp-label">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-theme-color hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="mp-label">Condition</label>
            <div className="flex gap-2 flex-wrap">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    condition === c.value
                      ? `${c.color} text-white`
                      : 'bg-gray-100 dark:bg-gray-800 text-theme-color hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mp-label">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your item — brand, size, usage, etc."
              rows={4}
              maxLength={2000}
              className={`mp-input resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="mp-label">Pickup Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-color-50" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Hostel B, College Canteen"
                className="mp-input pl-9"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-color/10 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-theme-color/20 text-theme-color">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════════ */
function DetailModal({
  listing,
  onClose,
  onSave,
  onEdit,
  onMarkSold,
  onDelete,
  onContact,
}: {
  listing: Listing;
  onClose: () => void;
  onSave: (id: string) => void;
  onEdit: (l: Listing) => void;
  onMarkSold: (id: string) => void;
  onDelete: (id: string) => void;
  onContact: (l: Listing) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isSold = listing.status === 'sold';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mp-modal w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close / Actions bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
          <button onClick={onClose} aria-label="Back" className="mp-icon-btn">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => onSave(listing._id)} className="mp-icon-btn">
              {listing.isSaved ? (
                <Bookmark className="w-5 h-5 fill-blue-500 text-blue-500" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
            {listing.isOwner && (
              <div className="relative">
                <button onClick={() => setShowMenu(m => !m)} aria-label="More options" className="mp-icon-btn">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 w-40 rounded-xl shadow-xl overflow-hidden z-20 bg-theme-background border border-theme-color/10">
                    <button
                      onClick={() => { setShowMenu(false); onEdit(listing); }}
                      className="mp-menu-item"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    {!isSold && (
                      <button
                        onClick={() => { setShowMenu(false); onMarkSold(listing._id); }}
                        className="mp-menu-item"
                      >
                        <Check className="w-4 h-4" /> Mark Sold
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); onDelete(listing._id); }}
                      className="mp-menu-item text-red-500"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image carousel */}
        {listing.images && listing.images.length > 0 ? (
          <ImageCarousel images={listing.images} alt={listing.title} />
        ) : (
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-7xl">
            {getCategoryInfo(listing.category).icon}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Price + Title */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-theme-color leading-tight">{listing.title}</h2>
              <p className="text-xl font-bold text-blue-500 whitespace-nowrap">
                {listing.price === 0 ? 'Free' : formatPrice(listing.price)}
              </p>
            </div>
            {listing.isNegotiable && (
              <span className="text-xs text-theme-color-50">Price negotiable</span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="mp-badge bg-gray-100 dark:bg-gray-800 text-theme-color">
              <Tag className="w-3 h-3" /> {getCategoryInfo(listing.category).label}
            </span>
            <span className={`mp-badge text-white ${getConditionInfo(listing.condition).color}`}>
              {getConditionInfo(listing.condition).label}
            </span>
            {isSold && (
              <span className="mp-badge bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">Sold</span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-theme-color mb-1">Description</h3>
            <p className="text-sm text-theme-color-70 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </div>

          {/* Location */}
          {listing.meetupLocations?.[0] && (
            <div className="flex items-center gap-2 text-sm text-theme-color-60">
              <MapPin className="w-4 h-4 text-blue-500" />
              {listing.meetupLocations[0]}
            </div>
          )}

          {/* Seller */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <img
              src={listing.seller?.profilePicture || '/default-avatar.svg'}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-theme-color truncate">{listing.seller?.name || listing.seller?.username || 'Seller'}</p>
              {listing.seller?.college?.name && (
                <p className="text-xs text-theme-color-50 truncate">{listing.seller.college.name}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-theme-color-50">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Posted {timeAgo(listing.createdAt)}</span>
            {listing.views !== undefined && listing.views > 0 && (
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views} views</span>
            )}
          </div>
        </div>

        {/* Action bar */}
        {!listing.isOwner && !isSold && (
          <div className="p-4 border-t border-theme-color/10">
            <Button
              onClick={() => onContact(listing)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-base font-semibold rounded-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Message Seller
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN MARKETPLACE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Marketplace = () => {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'saved' | 'mylistings'>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);

  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    condition: '',
    search: '',
    sort: 'newest',
  });

  /* ── Fetch current user ── */
  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    axios
      .get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setCurrentUser(r.data))
      .catch(() => {});
  }, [router]);

  /* ── Fetch listings ── */
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      let url = '/api/marketplace';
      if (activeTab === 'saved') url = '/api/marketplace/saved';
      else if (activeTab === 'mylistings') url = '/api/marketplace/my-listings';

      const params = activeTab === 'browse'
        ? {
            category: filters.category !== 'all' ? filters.category : undefined,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
            condition: filters.condition || undefined,
            search: filters.search || undefined,
            sort: filters.sort,
          }
        : {};

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setListings(res.data.listings || []);
    } catch (err: any) {
      if (err.response?.status === 401) { localStorage.removeItem('token'); router.push('/login'); }
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, router]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /* ── Search debounce ── */
  const handleSearchChange = (value: string) => {
    setFilters(f => ({ ...f, search: value }));
  };

  /* ── Upload images + create/update ── */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const res = await axios.post('/api/marketplace/upload-images', formData, {
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' },
    });
    return res.data.urls || [];
  };

  const handleCreate = async (data: any, files: File[]) => {
    let imageUrls: string[] = [];
    if (files.length > 0) {
      imageUrls = await uploadImages(files);
    }
    const res = await axios.post('/api/marketplace', {
      ...data,
      images: imageUrls,
    }, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    // Immediately add to listings so no refresh needed
    const newItem = res.data.item;
    if (newItem) {
      setListings(prev => [newItem, ...prev]);
    } else {
      fetchListings();
    }
    setShowCreateModal(false);
    toast.success('Listing published!');
  };

  const handleUpdate = async (data: any, files: File[]) => {
    if (!editingListing) return;
    let newUrls: string[] = [];
    if (files.length > 0) {
      newUrls = await uploadImages(files);
    }
    const allImages = [...(data.existingImageUrls || []), ...newUrls].slice(0, 5);

    const res = await axios.patch(`/api/marketplace/${editingListing._id}`, {
      ...data,
      images: allImages,
    }, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const updated = res.data.item;
    if (updated) {
      setListings(prev => prev.map(l => l._id === updated._id ? { ...l, ...updated } : l));
    } else {
      fetchListings();
    }
    setEditingListing(null);
    setSelectedListing(null);
    toast.success('Listing updated!');
  };

  const handleSave = async (id: string) => {
    try {
      const res = await axios.post(`/api/marketplace/${id}/save`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const newSaved = res.data.isSaved;
      setListings(prev => prev.map(l => l._id === id ? { ...l, isSaved: newSaved } : l));
      if (selectedListing?._id === id) {
        setSelectedListing(prev => prev ? { ...prev, isSaved: newSaved } : prev);
      }
      toast.success(newSaved ? 'Saved!' : 'Removed from saved');
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleMarkSold = async (id: string) => {
    try {
      await axios.patch(`/api/marketplace/${id}/sold`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'sold' } : l));
      setSelectedListing(null);
      toast.success('Marked as sold');
    } catch (err) {
      console.error('Mark sold failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await axios.delete(`/api/marketplace/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setListings(prev => prev.filter(l => l._id !== id));
      setSelectedListing(null);
      toast.success('Listing deleted');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleContact = async (listing: Listing) => {
    try {
      const msg = `Hi! I'm interested in "${listing.title}" listed for ${formatPrice(listing.price)}. Is it still available?`;
      await axios.post('/api/messages/send', {
        recipientId: listing.seller?._id,
        content: msg,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setSelectedListing(null);
      router.push(`/messages?userId=${listing.seller?._id}&username=${encodeURIComponent(listing.seller?.username || listing.seller?.name || '')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  const activeFiltersCount = [
    filters.category !== 'all',
    !!filters.minPrice,
    !!filters.maxPrice,
    !!filters.condition,
  ].filter(Boolean).length;

  /* ──────────── RENDER ──────────── */
  return (
    <div className="min-h-screen bg-theme-background">
      <Navbar />

      <div className="md:ml-64 pb-20 md:pb-8 pt-14 md:pt-0">
        {/* ── Header ── */}
        <div className="mp-header">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-theme-color flex items-center gap-2">
              <Package className="w-6 h-6" /> Marketplace
            </h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 h-9 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" /> Sell
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* ── Search bar ── */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-color-50" />
              <input
                type="text"
                value={filters.search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search marketplace..."
                className="mp-input pl-10 h-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`mp-filter-btn ${activeFiltersCount > 0 || showFilters ? 'mp-filter-btn-active' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 mt-4 border-b border-theme-color/10">
            {([
              { id: 'browse' as const, label: 'Browse', icon: Package },
              { id: 'saved' as const, label: 'Saved', icon: Bookmark },
              { id: 'mylistings' as const, label: 'My Listings', icon: Tag },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mp-tab ${activeTab === tab.id ? 'mp-tab-active' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Filters panel ── */}
          {showFilters && activeTab === 'browse' && (
            <div className="mt-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-theme-color/10 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Categories */}
              <div>
                <p className="text-xs font-medium text-theme-color-50 mb-2">Category</p>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setFilters(f => ({ ...f, category: cat.value }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.category === cat.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-theme-color shadow-sm hover:shadow'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + Condition + Sort */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                    placeholder="Min ₹"
                    className="mp-input w-24 h-9 text-sm"
                  />
                  <span className="text-theme-color-30">—</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    placeholder="Max ₹"
                    className="mp-input w-24 h-9 text-sm"
                  />
                </div>
                <select
                  value={filters.condition}
                  onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))}
                  className="mp-input h-9 text-sm"
                  aria-label="Condition filter"
                >
                  <option value="">Any Condition</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select
                  value={filters.sort}
                  onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                  className="mp-input h-9 text-sm"
                  aria-label="Sort order"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="popular">Most Viewed</option>
                </select>
              </div>

              {/* Clear */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(f => ({ ...f, category: 'all', minPrice: '', maxPrice: '', condition: '' }))}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* ── Category pills (always visible on browse, compact) ── */}
          {!showFilters && activeTab === 'browse' && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFilters(f => ({ ...f, category: cat.value }))}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.category === cat.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-theme-color hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Sort bar (non-filter for browse) ── */}
          {!showFilters && activeTab === 'browse' && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-theme-color-50">
                {loading ? '' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
              </p>
              <select
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="text-xs bg-transparent text-theme-color-60 border-none outline-none cursor-pointer"
                aria-label="Sort listings"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price ↑</option>
                <option value="price-high">Price ↓</option>
                <option value="popular">Popular</option>
              </select>
            </div>
          )}

          {/* ── Listings grid ── */}
          <div className="mt-4">
            {loading ? (
              <div className="mp-grid">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">
                  {activeTab === 'browse' && '🔍'}
                  {activeTab === 'saved' && '🔖'}
                  {activeTab === 'mylistings' && '📦'}
                </div>
                <p className="text-theme-color font-medium">
                  {activeTab === 'browse' && 'No listings found'}
                  {activeTab === 'saved' && 'No saved listings'}
                  {activeTab === 'mylistings' && 'No listings yet'}
                </p>
                <p className="text-sm text-theme-color-50">
                  {activeTab === 'browse' && 'Try different filters or be the first to list something!'}
                  {activeTab === 'saved' && 'Save listings you like by tapping the bookmark icon'}
                  {activeTab === 'mylistings' && 'Start selling — tap the Sell button above'}
                </p>
                {activeTab !== 'browse' && (
                  <Button
                    onClick={() => activeTab === 'mylistings' ? setShowCreateModal(true) : setActiveTab('browse')}
                    variant="outline"
                    className="mt-2"
                  >
                    {activeTab === 'mylistings' ? 'Create Listing' : 'Browse Marketplace'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="mp-grid">
                {listings.map(listing => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    onOpen={() => setSelectedListing(listing)}
                    onSave={handleSave}
                    currentUserId={currentUser?._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreateModal && (
        <ListingFormModal
          isEdit={false}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingListing && (
        <ListingFormModal
          isEdit
          initial={editingListing}
          existingImages={editingListing.images}
          onClose={() => setEditingListing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {selectedListing && (
        <DetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSave={handleSave}
          onEdit={l => { setSelectedListing(null); setEditingListing(l); }}
          onMarkSold={handleMarkSold}
          onDelete={handleDelete}
          onContact={handleContact}
        />
      )}
    </div>
  );
};

export default Marketplace;
