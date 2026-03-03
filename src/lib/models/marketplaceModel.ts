import mongoose, { Schema } from 'mongoose';
import type { IMarketplaceItem } from '@/types';

delete (mongoose.models as any).MarketplaceItem;

const marketplaceItemSchema = new Schema<IMarketplaceItem>({
  title: { type: String, required: true, maxlength: 200, trim: true },
  description: { type: String, required: true, maxlength: 2000 },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerCollege: {
    code: { type: String },
    name: { type: String },
    city: { type: String },
  },
  category: {
    type: String,
    enum: ['books', 'electronics', 'notes', 'tickets', 'furniture', 'clothing', 'services', 'transport', 'vehicles', 'other'],
    required: true,
  },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  isNegotiable: { type: Boolean, default: true },
  isFree: { type: Boolean, default: false },
  images: [{ type: String }],
  condition: { type: String, enum: ['new', 'like-new', 'good', 'fair', 'poor'], default: 'good' },
  status: { type: String, enum: ['available', 'reserved', 'sold', 'removed'], default: 'available' },
  savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String, lowercase: true }],
  meetupLocations: [{ type: String }],
  isVisible: { type: Boolean, default: true },
  reportedBy: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  reportCount: { type: Number, default: 0 },
  interestedBuyers: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    offeredPrice: { type: Number },
    createdAt: { type: Date, default: Date.now },
  }],
  buyer: { type: Schema.Types.ObjectId, ref: 'User' },
  soldAt: { type: Date },
  soldPrice: { type: Number },
  canDeliver: { type: Boolean, default: false },
  deliveryCharge: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

marketplaceItemSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.price === 0) this.isFree = true;
  next();
});

marketplaceItemSchema.index({ status: 1, isVisible: 1, createdAt: -1 });
marketplaceItemSchema.index({ 'sellerCollege.code': 1 });
marketplaceItemSchema.index({ category: 1, status: 1 });
marketplaceItemSchema.index({ price: 1 });
marketplaceItemSchema.index({ tags: 1 });
marketplaceItemSchema.index({ seller: 1 });

const MarketplaceItem = mongoose.model<IMarketplaceItem>('MarketplaceItem', marketplaceItemSchema);

export default MarketplaceItem;
