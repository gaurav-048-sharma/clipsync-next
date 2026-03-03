import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Event from '@/lib/models/eventModel';
import User from '@/lib/models/authModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';

export async function createEvent(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const body = await req.json();
    const { title, description, category, startDate, endDate, venue, coverImage, images, registrationType, ticketPrice, maxAttendees, registrationDeadline, registrationLink, tags, targetColleges, clubName } = body;

    if (!title || !description || !category || !startDate || !endDate || !venue?.name) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    if (new Date(startDate) < new Date()) return NextResponse.json({ message: 'Start date must be in the future' }, { status: 400 });
    if (new Date(endDate) < new Date(startDate)) return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 });

    const user = await User.findById(authUser._id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const event = new Event({
      title, description, organizer: authUser._id, organizerCollege: (user as any).college || {}, clubName, category,
      startDate: new Date(startDate), endDate: new Date(endDate), venue, coverImage, images: images || [],
      registrationType: registrationType || 'free', ticketPrice: registrationType === 'paid' ? ticketPrice : 0,
      maxAttendees, registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      registrationLink, tags: tags || [], targetColleges: targetColleges || ['ALL'],
    });
    await event.save();
    return NextResponse.json({ message: 'Event created successfully', event }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to create event' }, { status: 500 });
  }
}

export async function getEvents(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const college = searchParams.get('college');
    const sort = searchParams.get('sort') || 'upcoming';
    const status = searchParams.get('status') || 'published';

    const user = await User.findById(authUser._id);
    const userCollegeCode = (user as any)?.college?.code;
    const query: any = { status };
    if (sort === 'upcoming') query.startDate = { $gte: new Date() };
    if (userCollegeCode) query.$or = [{ targetColleges: 'ALL' }, { targetColleges: userCollegeCode }];
    if (category && category !== 'all') query.category = category;
    if (college && college !== 'all') query['organizerCollege.code'] = college;

    let sortOption: any = {};
    switch (sort) { case 'popular': sortOption = { views: -1 }; break; case 'recent': sortOption = { createdAt: -1 }; break; default: sortOption = { startDate: 1 }; }

    const skip = (page - 1) * limit;
    const events = await Event.find(query).populate('organizer', 'username name college').sort(sortOption).skip(skip).limit(limit).lean();
    const total = await Event.countDocuments(query);

    const eventsWithUserData = (events as any[]).map(event => ({
      ...event,
      isGoing: event.attendees?.some((a: any) => a.user?.toString() === authUser._id && ['going', 'registered'].includes(a.status)),
      isInterested: event.interested?.includes(authUser._id),
      attendeeCount: event.attendees?.filter((a: any) => ['going', 'registered'].includes(a.status)).length || 0,
      interestedCount: event.interested?.length || 0,
    }));

    return NextResponse.json({ events: eventsWithUserData, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function getEvent(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const event = await Event.findById(id).populate('organizer', 'username name college profilePicture').populate('attendees.user', 'username name college profilePicture').lean() as any;
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    await Event.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return NextResponse.json({
      ...event,
      isGoing: event.attendees?.some((a: any) => a.user?._id?.toString() === authUser._id && ['going', 'registered'].includes(a.status)),
      isInterested: event.interested?.some((u: any) => u.toString() === authUser._id),
      attendeeCount: event.attendees?.filter((a: any) => ['going', 'registered'].includes(a.status)).length || 0,
      interestedCount: event.interested?.length || 0,
      isOrganizer: event.organizer?._id?.toString() === authUser._id,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function rsvpEvent(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { action } = await req.json();
    const event = await Event.findById(id) as any;
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

    if (action === 'going' && event.maxAttendees) {
      const current = event.attendees.filter((a: any) => ['going', 'registered'].includes(a.status)).length;
      if (current >= event.maxAttendees) return NextResponse.json({ message: 'Event is at full capacity' }, { status: 400 });
    }

    event.attendees = event.attendees.filter((a: any) => a.user.toString() !== authUser._id);
    event.interested = event.interested.filter((u: any) => u.toString() !== authUser._id);
    if (action === 'going') event.attendees.push({ user: authUser._id, status: 'going', registeredAt: new Date() });
    else if (action === 'interested') event.interested.push(authUser._id);
    await event.save();

    return NextResponse.json({
      message: `RSVP updated to: ${action}`, isGoing: action === 'going', isInterested: action === 'interested',
      attendeeCount: event.attendees.filter((a: any) => ['going', 'registered'].includes(a.status)).length,
      interestedCount: event.interested.length,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to RSVP' }, { status: 500 });
  }
}

export async function updateEvent(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const updates = await req.json();
    const event = await Event.findById(id) as any;
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    if (event.organizer.toString() !== authUser._id) return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    delete updates.organizer; delete updates.organizerCollege; delete updates.attendees; delete updates.interested; delete updates.views;
    Object.assign(event, updates);
    await event.save();
    return NextResponse.json({ message: 'Event updated', event });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to update event' }, { status: 500 });
  }
}

export async function cancelEvent(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const event = await Event.findById(id) as any;
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    if (event.organizer.toString() !== authUser._id) return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    event.status = 'cancelled';
    await event.save();
    return NextResponse.json({ message: 'Event cancelled' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to cancel event' }, { status: 500 });
  }
}

export async function deleteEvent(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const event = await Event.findById(id) as any;
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    if (event.organizer.toString() !== authUser._id) return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    await event.deleteOne();
    return NextResponse.json({ message: 'Event deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to delete event' }, { status: 500 });
  }
}

export async function getMyEvents(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const events = await Event.find({ organizer: authUser._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function getAttendingEvents(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const events = await Event.find({ 'attendees.user': authUser._id, 'attendees.status': { $in: ['going', 'registered'] }, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).lean();
    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function getCategories() {
  const categories = [
    { value: 'fest', label: 'College Fest', icon: '🎉' }, { value: 'hackathon', label: 'Hackathon', icon: '💻' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' }, { value: 'seminar', label: 'Seminar', icon: '🎤' },
    { value: 'sports', label: 'Sports', icon: '⚽' }, { value: 'cultural', label: 'Cultural', icon: '🎭' },
    { value: 'party', label: 'Party', icon: '🎊' }, { value: 'meetup', label: 'Meetup', icon: '👥' },
    { value: 'other', label: 'Other', icon: '📌' },
  ];
  return NextResponse.json({ categories });
}
