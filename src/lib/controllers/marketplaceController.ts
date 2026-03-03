import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import MarketplaceItem from '@/lib/models/marketplaceModel';
import User from '@/lib/models/authModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { uploadToS3 } from '@/lib/config/s3';

export async function createListing(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const body = await req.json();
    const { title, description, category, price, originalPrice, isNegotiable, condition, images, meetupLocations, canDeliver, deliveryCharge, tags } = body;

    if (!title || !description || !category || price === undefined) {
      return NextResponse.json({ message: 'Title, description, category, and price are required' }, { status: 400 });
    }
    if (price < 0) return NextResponse.json({ message: 'Price cannot be negative' }, { status: 400 });

    const user = await User.findById(authUser._id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const item = new MarketplaceItem({
      title: title.trim(),
      description: description.trim(),
      seller: authUser._id,
      sellerCollege: (user as any).college || {},
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      isNegotiable: isNegotiable !== false,
      isFree: Number(price) === 0,
      condition: condition || 'good',
      images: images || [],
      meetupLocations: meetupLocations || [],
      canDeliver: canDeliver || false,
      deliveryCharge: canDeliver ? (deliveryCharge || 0) : 0,
      tags: tags || [],
      isVisible: true,
    });
    await item.save();

    // Return with populated seller for immediate display
    const populated = await MarketplaceItem.findById(item._id)
      .populate('seller', 'username name college profilePicture')
      .lean();

    return NextResponse.json({ message: 'Listing created successfully', item: populated }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('createListing error:', err);
    return NextResponse.json({ message: 'Failed to create listing' }, { status: 500 });
  }
}

export async function getListings(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sort = searchParams.get('sort') || 'recent';
    const search = searchParams.get('search');
    const isFree = searchParams.get('isFree');

    // Query: available + visible (OR items without isVisible field for backward compat)
    const query: any = { status: 'available', $or: [{ isVisible: true }, { isVisible: { $exists: false } }] };
    if (category && category !== 'all') query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (isFree === 'true') query.isFree = true;
    if (condition && condition !== 'all') query.condition = condition;
    if (search) {
      query.$and = [
        ...(query.$and || []),
        { $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ]}
      ];
    }

    let sortOption: any = {};
    switch (sort) {
      case 'price-low': sortOption = { price: 1 }; break;
      case 'price-high': sortOption = { price: -1 }; break;
      case 'popular': sortOption = { views: -1, createdAt: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MarketplaceItem.find(query)
        .populate('seller', 'username name college profilePicture')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceItem.countDocuments(query),
    ]);

    const listings = (items as any[]).map(item => ({
      ...item,
      isSaved: item.savedBy?.some((u: any) => u.toString() === authUser._id),
      isOwner: item.seller?._id?.toString() === authUser._id,
    }));

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('getListings error:', err);
    return NextResponse.json({ message: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function getListing(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const item = await MarketplaceItem.findById(id)
      .populate('seller', 'username name college profilePicture')
      .lean() as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });

    // Increment views (unique per user)
    await MarketplaceItem.updateOne(
      { _id: id, 'viewedBy': { $ne: authUser._id } },
      { $inc: { views: 1 }, $addToSet: { viewedBy: authUser._id } }
    );

    return NextResponse.json({
      ...item,
      views: (item.views || 0) + 1,
      isSaved: item.savedBy?.some((u: any) => u.toString() === authUser._id),
      isOwner: item.seller?._id?.toString() === authUser._id,
      interestedCount: item.interestedBuyers?.length || 0,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('getListing error:', err);
    return NextResponse.json({ message: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function toggleSaveListing(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });

    const isSaved = item.savedBy.some((u: any) => u.toString() === authUser._id);
    if (isSaved) {
      await MarketplaceItem.updateOne({ _id: id }, { $pull: { savedBy: authUser._id } });
    } else {
      await MarketplaceItem.updateOne({ _id: id }, { $addToSet: { savedBy: authUser._id } });
    }
    return NextResponse.json({ message: isSaved ? 'Listing unsaved' : 'Listing saved', isSaved: !isSaved });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to save listing' }, { status: 500 });
  }
}

export async function expressInterest(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { message, offeredPrice } = await req.json();
    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    if (item.seller.toString() === authUser._id) {
      return NextResponse.json({ message: 'Cannot express interest in your own listing' }, { status: 400 });
    }

    const existingIdx = (item.interestedBuyers || []).findIndex((b: any) => b.user.toString() === authUser._id);
    if (existingIdx >= 0) {
      item.interestedBuyers[existingIdx].message = message;
      item.interestedBuyers[existingIdx].offeredPrice = offeredPrice;
      item.interestedBuyers[existingIdx].createdAt = new Date();
    } else {
      if (!item.interestedBuyers) item.interestedBuyers = [];
      item.interestedBuyers.push({ user: authUser._id, message, offeredPrice, createdAt: new Date() });
    }
    await item.save();
    return NextResponse.json({ message: 'Interest expressed successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to express interest' }, { status: 500 });
  }
}

export async function updateListing(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const updates = await req.json();
    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    if (item.seller.toString() !== authUser._id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    // Prevent updating protected fields
    const forbidden = ['seller', 'sellerCollege', 'interestedBuyers', 'savedBy', 'views', 'viewedBy', 'reportedBy', 'reportCount'];
    forbidden.forEach(f => delete updates[f]);

    Object.assign(item, updates);
    await item.save();

    const populated = await MarketplaceItem.findById(id)
      .populate('seller', 'username name college profilePicture')
      .lean();

    return NextResponse.json({ message: 'Listing updated', item: populated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('updateListing error:', err);
    return NextResponse.json({ message: 'Failed to update listing' }, { status: 500 });
  }
}

export async function markAsSold(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);

    let buyerId, soldPrice;
    try {
      const body = await req.json();
      buyerId = body.buyerId;
      soldPrice = body.soldPrice;
    } catch {
      // Body may be empty
    }

    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    if (item.seller.toString() !== authUser._id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    item.status = 'sold';
    item.buyer = buyerId || null;
    item.soldAt = new Date();
    item.soldPrice = soldPrice || item.price;
    await item.save();
    return NextResponse.json({ message: 'Item marked as sold', item });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to mark as sold' }, { status: 500 });
  }
}

export async function deleteListing(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    if (item.seller.toString() !== authUser._id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }
    await item.deleteOne();
    return NextResponse.json({ message: 'Listing deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to delete listing' }, { status: 500 });
  }
}

export async function getMyListings(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = { seller: authUser._id };
    if (status && status !== 'all') query.status = status;
    const items = await MarketplaceItem.find(query)
      .populate('seller', 'username name college profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ listings: items });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function getSavedListings(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const items = await MarketplaceItem.find({ savedBy: authUser._id, status: 'available' })
      .populate('seller', 'username name college profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    const listings = (items as any[]).map(item => ({ ...item, isSaved: true }));
    return NextResponse.json({ listings });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch saved listings' }, { status: 500 });
  }
}

export async function uploadImages(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const formData = await req.formData();
    const images = formData.getAll('images') as File[];
    if (!images.length) return NextResponse.json({ message: 'No images provided' }, { status: 400 });

    const urls: string[] = [];
    for (const image of images.slice(0, 5)) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const url = await uploadToS3(buffer, image.name, image.type, 'marketplace');
      urls.push(url);
    }
    return NextResponse.json({ message: 'Images uploaded successfully', urls });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('uploadImages error:', err);
    return NextResponse.json({ message: 'Failed to upload images' }, { status: 500 });
  }
}

export async function getMarketplaceCategories() {
  const categories = [
    { value: 'books', label: 'Books & Textbooks', icon: '📚' },
    { value: 'electronics', label: 'Electronics', icon: '💻' },
    { value: 'notes', label: 'Notes & Study Material', icon: '📝' },
    { value: 'tickets', label: 'Event Tickets', icon: '🎫' },
    { value: 'furniture', label: 'Furniture', icon: '🪑' },
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'services', label: 'Services', icon: '🛠️' },
    { value: 'transport', label: 'Transport/Vehicles', icon: '🚲' },
    { value: 'other', label: 'Other', icon: '📦' },
  ];
  return NextResponse.json({ categories });
}

export async function reportListing(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { reason } = await req.json();
    const item = await MarketplaceItem.findById(id) as any;
    if (!item) return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    if (!item.reportedBy) item.reportedBy = [];
    if (item.reportedBy.some((r: any) => r.user.toString() === authUser._id)) {
      return NextResponse.json({ message: 'Already reported' }, { status: 400 });
    }
    item.reportedBy.push({ user: authUser._id, reason, createdAt: new Date() });
    item.reportCount = (item.reportCount || 0) + 1;
    if (item.reportCount >= 5) item.isVisible = false;
    await item.save();
    return NextResponse.json({ message: 'Listing reported' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to report listing' }, { status: 500 });
  }
}
