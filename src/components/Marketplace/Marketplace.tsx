'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '../Dashboard/Navbar';
import PrefetchLink from '@/components/ui/PrefetchLink';
import {
  Search, Plus, X, MapPin, Clock, MessageCircle, Heart, Grid, List,
  Check, Upload, Loader2, Trash2, Edit3, MoreVertical,
  Calendar, ShoppingBag, Sparkles, Home,
} from 'lucide-react';

/* ---------- constants ---------- */
interface CategoryOption { value: string; label: string; icon: string; }
interface ConditionOption { value: string; label: string; color: string; }

const CATEGORIES: CategoryOption[] = [
  { value: 'all', label: 'All', icon: '🛍️' },
  { value: 'books', label: 'Books & Notes', icon: '📚' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'furniture', label: 'Furniture', icon: '🛋️' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚲' },
  { value: 'tickets', label: 'Event Tickets', icon: '🎟️' },
  { value: 'notes', label: 'Study Notes', icon: '📝' },
  { value: 'services', label: 'Services', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const CONDITIONS: ConditionOption[] = [
  { value: 'new', label: 'Brand New', color: 'bg-green-500' },
  { value: 'like-new', label: 'Like New', color: 'bg-blue-500' },
  { value: 'good', label: 'Good', color: 'bg-yellow-500' },
  { value: 'fair', label: 'Fair', color: 'bg-orange-500' },
  { value: 'poor', label: 'Poor', color: 'bg-red-500' },
];

/* ---------- types ---------- */
interface SellerData {
  _id: string;
  name?: string;
  username?: string;
  profilePicture?: string;
  college?: { name?: string };
}

interface ListingData {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isNegotiable?: boolean;
  condition: string;
  images?: string[];
  meetupLocations?: string[];
  pickupLocation?: string;
  status?: string;
  isSaved?: boolean;
  seller?: SellerData;
  createdAt: string;
}

interface ListingFormState {
  title: string;
  description: string;
  category: string;
  price: string;
  isNegotiable: boolean;
  condition: string;
  images: string[];
  pickupLocation: string;
}

interface FiltersState {
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  search: string;
  sort: string;
}

interface CurrentUser {
  _id: string;
  [key: string]: any;
}

/* ---------- component ---------- */
const Marketplace = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingData | null>(null);
  const [editingListing, setEditingListing] = useState<ListingData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Image upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact seller modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactListing, setContactListing] = useState<ListingData | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Owner menu state
  const [ownerMenuOpen, setOwnerMenuOpen] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FiltersState>({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    condition: '',
    search: '',
    sort: 'newest',
  });

  // Create listing form
  const [listingForm, setListingForm] = useState<ListingFormState>({
    title: '',
    description: '',
    category: 'other',
    price: '',
    isNegotiable: false,
    condition: 'good',
    images: [],
    pickupLocation: '',
  });

  const router = useRouter();

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const cssProp = (obj: Record<string, string>) => obj as React.CSSProperties;

  /* ---------- current user ---------- */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  /* ---------- fetch listings ---------- */
  const fetchListings = async () => {
    try {
      setLoading(true);
      let url = '/api/marketplace';

      if (activeTab === 'saved') url = '/api/marketplace/saved';
      else if (activeTab === 'mylistings') url = '/api/marketplace/my-listings';

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params:
          activeTab === 'browse'
            ? {
                category: filters.category !== 'all' ? filters.category : undefined,
                minPrice: filters.minPrice || undefined,
                maxPrice: filters.maxPrice || undefined,
                condition: filters.condition || undefined,
                search: filters.search || undefined,
                sort: filters.sort,
              }
            : {},
      });

      setListings(response.data.listings || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  // Close owner menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setOwnerMenuOpen(null);
    if (ownerMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [ownerMenuOpen]);

  /* ---------- image handlers ---------- */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    setUploading(true);
    try {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await axios.post('/api/marketplace/upload-images', formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.urls || [];
    } catch (err) {
      console.error('Image upload failed:', err);
      throw new Error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setListingForm({
      title: '',
      description: '',
      category: 'other',
      price: '',
      isNegotiable: false,
      condition: 'good',
      images: [],
      pickupLocation: '',
    });
    setImageFiles([]);
    setImagePreviews([]);
  };

  /* ---------- CRUD ---------- */
  const handleCreateListing = async () => {
    if (!listingForm.title || !listingForm.description || !listingForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          imageUrls = await uploadImages();
        } catch {
          // Continue without images if upload fails
        }
      }

      const listingData = {
        title: listingForm.title,
        description: listingForm.description,
        category: listingForm.category,
        price: parseFloat(listingForm.price),
        isNegotiable: listingForm.isNegotiable,
        condition: listingForm.condition,
        images: imageUrls,
        meetupLocations: listingForm.pickupLocation ? [listingForm.pickupLocation] : [],
      };

      await axios.post('/api/marketplace', listingData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setShowCreateModal(false);
      resetForm();
      fetchListings();
      toast.success('Listing created successfully!');
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create listing');
    } finally {
      setUploading(false);
    }
  };

  const handleEditListing = (listing: ListingData) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price.toString(),
      isNegotiable: listing.isNegotiable || false,
      condition: listing.condition,
      images: listing.images || [],
      pickupLocation: listing.meetupLocations?.[0] || listing.pickupLocation || '',
    });
    setImagePreviews(listing.images || []);
    setShowEditModal(true);
    setSelectedListing(null);
  };

  const handleUpdateListing = async () => {
    if (!listingForm.title || !listingForm.description || !listingForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      let imageUrls = editingListing?.images || [];
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages();
        const existingImages = imagePreviews.filter((p) => p.startsWith('http'));
        imageUrls = [...existingImages, ...newUrls].slice(0, 5);
      } else {
        imageUrls = imagePreviews.filter((p) => p.startsWith('http'));
      }

      await axios.patch(`/api/marketplace/${editingListing?._id}`, {
        title: listingForm.title,
        description: listingForm.description,
        category: listingForm.category,
        price: parseFloat(listingForm.price),
        isNegotiable: listingForm.isNegotiable,
        condition: listingForm.condition,
        images: imageUrls,
        meetupLocations: listingForm.pickupLocation ? [listingForm.pickupLocation] : [],
      }, { headers: { Authorization: `Bearer ${getToken()}` } });

      setShowEditModal(false);
      setEditingListing(null);
      resetForm();
      fetchListings();
    } catch (err: any) {
      console.error('Failed to update listing:', err);
      toast.error(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveListing = async (listingId: string) => {
    try {
      const response = await axios.post(
        `/api/marketplace/${listingId}/save`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setListings((prev) =>
        prev.map((l) => (l._id === listingId ? { ...l, isSaved: response.data.isSaved } : l)),
      );

      if (selectedListing?._id === listingId) {
        setSelectedListing((prev) =>
          prev ? { ...prev, isSaved: response.data.isSaved } : prev,
        );
      }
    } catch (err) {
      console.error('Failed to save listing:', err);
    }
  };

  const handleContactSeller = (listing: ListingData) => {
    setContactListing(listing);
    setShowContactModal(true);
    setSelectedListing(null);
  };

  const confirmSendMessage = async () => {
    if (!contactListing) return;

    try {
      setSendingMessage(true);

      const listingMessage =
        `📦 *Interested in your listing*\n\n` +
        `🏷️ *${contactListing.title}*\n` +
        `💰 Price: ₹${contactListing.price}${contactListing.isNegotiable ? ' (Negotiable)' : ''}\n` +
        `📋 Condition: ${CONDITIONS.find((c) => c.value === contactListing.condition)?.label || contactListing.condition}\n` +
        `📝 ${contactListing.description}\n\n` +
        `Hi! I'm interested in this item. Is it still available?`;

      await axios.post(
        '/api/messages/send',
        {
          recipientId: contactListing.seller?._id,
          content: listingMessage,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setShowContactModal(false);
      setContactListing(null);

      // Navigate to messages with seller info via searchParams
      const sellerId = contactListing.seller?._id || '';
      const sellerName = contactListing.seller?.username || contactListing.seller?.name || '';
      router.push(`/messages?userId=${sellerId}&username=${encodeURIComponent(sellerName)}`);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkAsSold = async (listingId: string) => {
    try {
      await axios.patch(
        `/api/marketplace/${listingId}/sold`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      fetchListings();
      setSelectedListing(null);
    } catch (err) {
      console.error('Failed to mark as sold:', err);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`/api/marketplace/${listingId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchListings();
      setSelectedListing(null);
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  /* ---------- helpers ---------- */
  const getCategoryInfo = (value: string) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
  const getConditionInfo = (value: string) => CONDITIONS.find((c) => c.value === value) || CONDITIONS[2];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  /* ---------- shared form JSX ---------- */
  const renderListingForm = (isEdit: boolean) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>
          Title *
        </label>
        <input
          type="text"
          value={listingForm.title}
          onChange={(e) => setListingForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g., Engineering Mathematics Textbook"
          className="w-full p-3 rounded-lg"
          style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
        />
      </div>

      {/* Category & Condition */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Category *</label>
          <select
            value={listingForm.category}
            onChange={(e) => setListingForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full p-3 rounded-lg"
            style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
          >
            {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Condition *</label>
          <select
            value={listingForm.condition}
            onChange={(e) => setListingForm((f) => ({ ...f, condition: e.target.value }))}
            className="w-full p-3 rounded-lg"
            style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Description *</label>
        <textarea
          value={listingForm.description}
          onChange={(e) => setListingForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe your item, include details like brand, size, usage, etc."
          rows={4}
          className="w-full p-3 rounded-lg resize-none"
          style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
        />
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Price (₹) *</label>
          <input
            type="number"
            value={listingForm.price}
            onChange={(e) => setListingForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="Enter price"
            min="0"
            className="w-full p-3 rounded-lg"
            style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 p-3">
            <input
              type="checkbox"
              checked={listingForm.isNegotiable}
              onChange={(e) => setListingForm((f) => ({ ...f, isNegotiable: e.target.checked }))}
            />
            <span className="text-sm" style={cssProp({ color: 'var(--text-color)' })}>Price is negotiable</span>
          </label>
        </div>
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Pickup Location</label>
        <input
          type="text"
          value={listingForm.pickupLocation}
          onChange={(e) => setListingForm((f) => ({ ...f, pickupLocation: e.target.value }))}
          placeholder="e.g., College canteen, Hostel Block A"
          className="w-full p-3 rounded-lg"
          style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-1" style={cssProp({ color: 'var(--text-color)' })}>Photos (Max 5)</label>
        <div className="space-y-3">
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length < 5 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
              style={cssProp({ borderColor: 'var(--border-color)' })}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" style={cssProp({ color: 'var(--text-color)' })} />
              <p className="text-sm opacity-60" style={cssProp({ color: 'var(--text-color)' })}>
                {isEdit ? 'Click to upload more images' : 'Click to upload images'}
              </p>
              {!isEdit && (
                <p className="text-xs opacity-40 mt-1" style={cssProp({ color: 'var(--text-color)' })}>
                  {imagePreviews.length}/5 images
                </p>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  /* ---------- JSX ---------- */
  return (
    <div className="min-h-screen pt-14 pb-14 md:pt-0 md:pb-0" style={cssProp({ backgroundColor: 'var(--background-color)' })}>
      <Navbar />

      <div className="md:ml-64 flex flex-col">
        {/* Feature Top Bar */}
        <div className="sticky top-14 md:top-0 z-40 border-b border-gray-800/50" style={cssProp({ backgroundColor: 'var(--background-color)' })}>
          <div className="flex items-center justify-center px-3 md:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <PrefetchLink to="/dashboard" className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)', color: 'white', boxShadow: '0 2px 8px rgba(55, 65, 81, 0.3)' }}>
                <Home className="w-3.5 h-3.5 md:w-4 md:h-4" /><span>Home</span>
              </PrefetchLink>
              <PrefetchLink to="/events" className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' }}>
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /><span>Events</span>
              </PrefetchLink>
              <button className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', boxShadow: '0 2px 8px rgba(245, 87, 108, 0.5)', transform: 'scale(1.05)' }}>
                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" /><span>Marketplace</span>
              </button>
              <PrefetchLink to="/confessions" className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)' }}>
                <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /><span>Confessions</span>
              </PrefetchLink>
              <button onClick={() => router.push('/upload-story')} className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', boxShadow: '0 2px 8px rgba(250, 112, 154, 0.3)' }}>
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" /><span>Add Story</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={cssProp({ color: 'var(--text-color)' })}>🛍️ Campus Marketplace</h1>
                <p className="text-sm opacity-60" style={cssProp({ color: 'var(--text-color)' })}>Buy &amp; sell with fellow students</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                <Plus className="w-4 h-4 mr-1" /> Sell Item
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b" style={cssProp({ borderColor: 'var(--border-color)' })}>
              {[
                { id: 'browse', label: 'Browse' },
                { id: 'saved', label: 'Saved' },
                { id: 'mylistings', label: 'My Listings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'border-b-2 border-green-500 text-green-500' : 'opacity-60 hover:opacity-100'}`}
                  style={activeTab !== tab.id ? cssProp({ color: 'var(--text-color)' }) : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Filters (only for browse tab) */}
            {activeTab === 'browse' && (
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50" style={cssProp({ color: 'var(--text-color)' })} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    placeholder="Search for books, electronics, notes..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl"
                    style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFilters((f) => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${filters.category === cat.value ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                      style={filters.category !== cat.value ? cssProp({ color: 'var(--text-color)' }) : {}}
                    >
                      <span>{cat.icon}</span><span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 flex-wrap items-center">
                  <div className="flex items-center gap-2">
                    <input type="number" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} placeholder="Min ₹" className="w-24 p-2 rounded-lg text-sm" style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })} />
                    <span style={cssProp({ color: 'var(--text-color)' })}>-</span>
                    <input type="number" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} placeholder="Max ₹" className="w-24 p-2 rounded-lg text-sm" style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })} />
                  </div>
                  <select value={filters.condition} onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value }))} className="p-2 rounded-lg text-sm" style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}>
                    <option value="">Any Condition</option>
                    {CONDITIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                  <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className="p-2 rounded-lg text-sm" style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' })}>
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <div className="flex gap-1 ml-auto">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'opacity-50'}`}><Grid className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'opacity-50'}`}><List className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* Listings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg opacity-60" style={cssProp({ color: 'var(--text-color)' })}>
                  {activeTab === 'browse' && 'No listings found. Try different filters!'}
                  {activeTab === 'saved' && "You haven't saved any listings yet."}
                  {activeTab === 'mylistings' && "You haven't listed anything for sale yet."}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'space-y-4'}>
                {listings.map((listing) => (
                  <Card
                    key={listing._id}
                    className={`overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${viewMode === 'list' ? 'flex' : ''} ${listing.status === 'sold' ? 'opacity-60' : ''}`}
                    style={cssProp({ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' })}
                    onClick={() => setSelectedListing(listing)}
                  >
                    {/* Image */}
                    <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 md:w-48 md:h-48 flex-shrink-0' : 'h-48 md:h-56'} bg-gradient-to-br from-green-400 to-teal-500`}>
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{getCategoryInfo(listing.category).icon}</div>
                      )}
                      {listing.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">SOLD</span>
                        </div>
                      )}

                      {/* Owner 3-dots menu */}
                      {listing.seller?._id === currentUser?._id && listing.status !== 'sold' && (
                        <div className="absolute top-2 left-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(ownerMenuOpen === listing._id ? null : listing._id); }}
                            className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                          {ownerMenuOpen === listing._id && (
                            <div className="absolute top-8 left-0 w-32 rounded-lg shadow-lg overflow-hidden z-10" style={cssProp({ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' })}>
                              <button onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(null); handleEditListing(listing); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800" style={cssProp({ color: 'var(--text-color)' })}>
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(null); handleMarkAsSold(listing._id); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800" style={cssProp({ color: 'var(--text-color)' })}>
                                <Check className="w-4 h-4" /> Mark Sold
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(null); handleDeleteListing(listing._id); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={(e) => { e.stopPropagation(); handleSaveListing(listing._id); }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full">
                        <Heart className={`w-4 h-4 ${listing.isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                      </button>
                    </div>

                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1" style={cssProp({ color: 'var(--text-color)' })}>{listing.title}</h3>
                        <p className="font-bold text-green-500 whitespace-nowrap ml-2">{formatPrice(listing.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs text-white rounded-full ${getConditionInfo(listing.condition).color}`}>{getConditionInfo(listing.condition).label}</span>
                        {listing.isNegotiable && <span className="text-xs opacity-60" style={cssProp({ color: 'var(--text-color)' })}>Negotiable</span>}
                      </div>
                      <p className="text-sm opacity-60 line-clamp-2 mb-3" style={cssProp({ color: 'var(--text-color)' })}>{listing.description}</p>
                      <div className="flex items-center justify-between text-xs opacity-50" style={cssProp({ color: 'var(--text-color)' })}>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{formatTimeAgo(listing.createdAt)}</span></div>
                        <span>{listing.seller?.college?.name?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listing Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl rounded-xl overflow-hidden my-8" style={cssProp({ backgroundColor: 'var(--background-color)' })}>
            <div className="h-64 bg-gradient-to-br from-green-400 to-teal-500 relative">
              {selectedListing.images?.[0] ? (
                <img src={selectedListing.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">{getCategoryInfo(selectedListing.category).icon}</div>
              )}
              {selectedListing.status === 'sold' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-bold text-3xl">SOLD</span></div>
              )}
              <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><X className="w-5 h-5" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleSaveListing(selectedListing._id); }} className="absolute top-4 left-4 p-2 bg-white/80 rounded-full">
                <Heart className={`w-5 h-5 ${selectedListing.isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mb-2 inline-block">{getCategoryInfo(selectedListing.category).label}</span>
                  <h2 className="text-2xl font-bold" style={cssProp({ color: 'var(--text-color)' })}>{selectedListing.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-500">{formatPrice(selectedListing.price)}</p>
                  {selectedListing.isNegotiable && <p className="text-xs opacity-60" style={cssProp({ color: 'var(--text-color)' })}>Negotiable</p>}
                </div>
              </div>
              <div className="mb-4"><span className={`px-3 py-1 text-sm text-white rounded-full ${getConditionInfo(selectedListing.condition).color}`}>{getConditionInfo(selectedListing.condition).label}</span></div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={cssProp({ color: 'var(--text-color)' })}>Description</h3>
                <p className="text-sm opacity-80 whitespace-pre-wrap" style={cssProp({ color: 'var(--text-color)' })}>{selectedListing.description}</p>
              </div>
              {selectedListing.pickupLocation && (
                <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm opacity-60" style={cssProp({ color: 'var(--text-color)' })}>Pickup Location</p>
                    <p className="font-medium" style={cssProp({ color: 'var(--text-color)' })}>{selectedListing.pickupLocation}</p>
                  </div>
                </div>
              )}
              <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm opacity-60 mb-2" style={cssProp({ color: 'var(--text-color)' })}>Seller</p>
                <div className="flex items-center gap-3">
                  <img src={selectedListing.seller?.profilePicture || '/default-avatar.svg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium" style={cssProp({ color: 'var(--text-color)' })}>{selectedListing.seller?.name || selectedListing.seller?.username}</p>
                    <p className="text-sm opacity-60" style={cssProp({ color: 'var(--text-color)' })}>{selectedListing.seller?.college?.name}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm opacity-50 mb-6" style={cssProp({ color: 'var(--text-color)' })}>Posted {formatTimeAgo(selectedListing.createdAt)}</p>
              {selectedListing.seller?._id === currentUser?._id ? (
                <div className="flex gap-3">
                  {selectedListing.status !== 'sold' && (
                    <>
                      <Button className="flex-1 bg-blue-500 text-white" onClick={() => handleEditListing(selectedListing)}><Edit3 className="w-4 h-4 mr-2" /> Edit</Button>
                      <Button className="flex-1 bg-green-500 text-white" onClick={() => handleMarkAsSold(selectedListing._id)}><Check className="w-4 h-4 mr-2" /> Mark as Sold</Button>
                    </>
                  )}
                  <Button variant="outline" className="text-red-500 border-red-500" onClick={() => handleDeleteListing(selectedListing._id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ) : selectedListing.status !== 'sold' ? (
                <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white" onClick={() => handleContactSeller(selectedListing)}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Contact Seller
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 rounded-xl my-8" style={cssProp({ backgroundColor: 'var(--background-color)' })}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={cssProp({ color: 'var(--text-color)' })}>🛍️ Sell an Item</h2>
              <button onClick={() => setShowCreateModal(false)}><X className="w-6 h-6" style={cssProp({ color: 'var(--text-color)' })} /></button>
            </div>
            {renderListingForm(false)}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={cssProp({ borderColor: 'var(--border-color)' })}>
              <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleCreateListing} disabled={!listingForm.title || !listingForm.description || !listingForm.price || uploading} className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{imageFiles.length > 0 ? 'Uploading...' : 'Creating...'}</>) : 'List for Sale'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditModal && editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 rounded-xl my-8" style={cssProp({ backgroundColor: 'var(--background-color)' })}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={cssProp({ color: 'var(--text-color)' })}>✏️ Edit Listing</h2>
              <button onClick={() => { setShowEditModal(false); setEditingListing(null); resetForm(); }}><X className="w-6 h-6" style={cssProp({ color: 'var(--text-color)' })} /></button>
            </div>
            {renderListingForm(true)}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={cssProp({ borderColor: 'var(--border-color)' })}>
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingListing(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleUpdateListing} disabled={!listingForm.title || !listingForm.description || !listingForm.price || uploading} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>) : 'Update Listing'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Contact Seller Confirmation Modal */}
      {showContactModal && contactListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200" style={cssProp({ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' })}>
            <div className="text-center mb-6">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-xl font-bold mb-2">Contact Seller</h3>
              <p className="text-sm opacity-70">Send a message to {contactListing.seller?.name || 'the seller'} about this item?</p>
            </div>
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <div className="flex gap-3">
                {contactListing.images?.[0] && (
                  <img src={contactListing.images[0]} alt={contactListing.title} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{contactListing.title}</h4>
                  <p className="text-lg font-bold text-green-500">
                    ₹{contactListing.price}
                    {contactListing.isNegotiable && <span className="text-xs ml-2 opacity-60 font-normal">Negotiable</span>}
                  </p>
                  <p className="text-xs opacity-60 line-clamp-1">{contactListing.description}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 mb-6 text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' } as React.CSSProperties}>
              <p className="opacity-70 mb-1 text-xs">Message that will be sent:</p>
              <p>📦 <strong>Interested in your listing</strong></p>
              <p className="mt-1">🏷️ <strong>{contactListing.title}</strong></p>
              <p>💰 Price: ₹{contactListing.price}{contactListing.isNegotiable ? ' (Negotiable)' : ''}</p>
              <p className="mt-2 italic">&ldquo;Hi! I&apos;m interested in this item. Is it still available?&rdquo;</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowContactModal(false); setContactListing(null); }} disabled={sendingMessage}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white" onClick={confirmSendMessage} disabled={sendingMessage}>
                {sendingMessage ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>) : (<><MessageCircle className="w-4 h-4 mr-2" />Send Message</>)}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
