'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '../Dashboard/Navbar';
import PrefetchLink from '@/components/ui/PrefetchLink';
import {
  Calendar, MapPin, Users, Plus, Check, Star, X, ExternalLink,
  ShoppingBag, MessageSquare, Sparkles, Home,
} from 'lucide-react';

/* ---------- constants ---------- */
interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: 'all', label: 'All', icon: '📌' },
  { value: 'fest', label: 'College Fest', icon: '🎉' },
  { value: 'hackathon', label: 'Hackathon', icon: '💻' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'seminar', label: 'Seminar', icon: '🎤' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'party', label: 'Party', icon: '🎊' },
  { value: 'meetup', label: 'Meetup', icon: '👥' },
  { value: 'other', label: 'Other', icon: '📌' },
];

/* ---------- types ---------- */
interface Venue {
  name?: string;
  address?: string;
  isOnline?: boolean;
  onlineLink?: string;
}

interface EventData {
  _id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venue?: Venue;
  coverImage?: string;
  registrationType: string;
  ticketPrice?: number;
  maxAttendees?: number;
  attendeeCount?: number;
  interestedCount?: number;
  isGoing?: boolean;
  isInterested?: boolean;
  clubName?: string;
  organizer?: { name?: string; username?: string };
  organizerCollege?: { name?: string };
}

interface EventFormState {
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  isOnline: boolean;
  onlineLink: string;
  registrationType: string;
  ticketPrice: number | string;
  maxAttendees: string;
  clubName: string;
}

interface FilterState {
  category: string;
  sort: string;
}

/* ---------- component ---------- */
const Events = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [filter, setFilter] = useState<FilterState>({ category: 'all', sort: 'upcoming' });
  const [activeTab, setActiveTab] = useState<string>('discover');

  const [eventForm, setEventForm] = useState<EventFormState>({
    title: '',
    description: '',
    category: 'other',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    venueName: '',
    venueAddress: '',
    isOnline: false,
    onlineLink: '',
    registrationType: 'free',
    ticketPrice: 0,
    maxAttendees: '',
    clubName: '',
  });

  const router = useRouter();

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeTab]);

  /* ---------- api helpers ---------- */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = '/api/events';

      if (activeTab === 'attending') {
        url = '/api/events/attending';
      } else if (activeTab === 'myevents') {
        url = '/api/events/my-events';
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params:
          activeTab === 'discover'
            ? {
                category: filter.category !== 'all' ? filter.category : undefined,
                sort: filter.sort,
              }
            : {},
      });

      setEvents(response.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`);
      const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime}`);

      await axios.post(
        '/api/events',
        {
          title: eventForm.title,
          description: eventForm.description,
          category: eventForm.category,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          venue: {
            name: eventForm.venueName,
            address: eventForm.venueAddress,
            isOnline: eventForm.isOnline,
            onlineLink: eventForm.onlineLink,
          },
          registrationType: eventForm.registrationType,
          ticketPrice: eventForm.registrationType === 'paid' ? eventForm.ticketPrice : 0,
          maxAttendees: eventForm.maxAttendees ? parseInt(eventForm.maxAttendees) : null,
          clubName: eventForm.clubName,
          targetColleges: ['ALL'],
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setShowCreateModal(false);
      setEventForm({
        title: '',
        description: '',
        category: 'other',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        venueName: '',
        venueAddress: '',
        isOnline: false,
        onlineLink: '',
        registrationType: 'free',
        ticketPrice: 0,
        maxAttendees: '',
        clubName: '',
      });
      fetchEvents();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleRSVP = async (eventId: string, action: string) => {
    try {
      const response = await axios.post(
        `/api/events/${eventId}/rsvp`,
        { action },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? {
                ...e,
                isGoing: response.data.isGoing,
                isInterested: response.data.isInterested,
                attendeeCount: response.data.attendeeCount,
                interestedCount: response.data.interestedCount,
              }
            : e,
        ),
      );

      if (selectedEvent?._id === eventId) {
        setSelectedEvent((prev) =>
          prev
            ? {
                ...prev,
                isGoing: response.data.isGoing,
                isInterested: response.data.isInterested,
                attendeeCount: response.data.attendeeCount,
                interestedCount: response.data.interestedCount,
              }
            : prev,
        );
      }
    } catch (err: any) {
      console.error('Failed to RSVP:', err);
      toast.error(err.response?.data?.message || 'Failed to RSVP');
    }
  };

  /* ---------- helpers ---------- */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getCategoryInfo = (value: string) =>
    CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];

  /* ---------- JSX ---------- */
  return (
    <div
      className="min-h-screen pt-14 pb-14 md:pt-0 md:pb-0 bg-theme-background"
    >
      <Navbar />

      <div className="md:ml-64 flex flex-col">
        {/* Feature Top Bar */}
        <div
          className="sticky top-14 md:top-0 z-40 border-b border-gray-800/50 bg-theme-background"
        >
          <div className="flex items-center justify-center px-3 md:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <PrefetchLink
                to="/dashboard"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(55, 65, 81, 0.3)',
                }}
              >
                <Home className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Home</span>
              </PrefetchLink>
              <button
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.5)',
                  transform: 'scale(1.05)',
                }}
              >
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Events</span>
              </button>
              <PrefetchLink
                to="/marketplace"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)',
                }}
              >
                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Marketplace</span>
              </PrefetchLink>
              <PrefetchLink
                to="/confessions"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Confessions</span>
              </PrefetchLink>
              <button
                onClick={() => router.push('/upload-story')}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(250, 112, 154, 0.3)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Add Story</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-theme-color">
                  🎉 Events Hub
                </h1>
                <p className="text-sm opacity-60 text-theme-color">
                  Discover &amp; attend college events
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Create Event
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-theme-color">
              {[
                { id: 'discover', label: 'Discover' },
                { id: 'attending', label: 'Attending' },
                { id: 'myevents', label: 'My Events' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-2 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-b-2 border-orange-500 text-orange-500'
                      : 'text-theme-color opacity-60 hover:opacity-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter (only for discover tab) */}
            {activeTab === 'discover' && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilter((f) => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                      filter.category === cat.value
                        ? 'bg-orange-500 text-white'
                        : 'text-theme-color bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg opacity-60 text-theme-color">
                  {activeTab === 'discover' && 'No upcoming events. Create one!'}
                  {activeTab === 'attending' && "You haven't RSVP'd to any events yet."}
                  {activeTab === 'myevents' && "You haven't created any events yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card
                    key={event._id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all bg-theme-background border border-theme-color"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-br from-orange-400 to-red-500 relative">
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {getCategoryInfo(event.category).icon}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                          {getCategoryInfo(event.category).label}
                        </span>
                      </div>
                      {event.registrationType === 'free' && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            FREE
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3
                        className="font-semibold text-lg mb-2 line-clamp-1 text-theme-color"
                      >
                        {event.title}
                      </h3>

                      <div
                        className="space-y-1.5 text-sm opacity-70 mb-3 text-theme-color"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(event.startDate)} at {formatTime(event.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">
                            {event.venue?.isOnline ? '🌐 Online Event' : event.venue?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.attendeeCount || 0} going • {event.interestedCount || 0} interested
                          </span>
                        </div>
                      </div>

                      {/* Quick RSVP Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={event.isGoing ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRSVP(event._id, event.isGoing ? 'not-going' : 'going');
                          }}
                          className={event.isGoing ? 'bg-green-500 text-white' : ''}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {event.isGoing ? 'Going' : "I'm Going"}
                        </Button>
                        <Button
                          size="sm"
                          variant={event.isInterested ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRSVP(event._id, event.isInterested ? 'not-going' : 'interested');
                          }}
                          className={event.isInterested ? 'bg-yellow-500 text-white' : ''}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Interested
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <Card
              className="w-full max-w-2xl rounded-xl overflow-hidden my-8 bg-theme-background"
            >
              {/* Cover */}
              <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 relative">
                {selectedEvent.coverImage ? (
                  <img src={selectedEvent.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {getCategoryInfo(selectedEvent.category).icon}
                  </div>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full mb-2 inline-block">
                      {getCategoryInfo(selectedEvent.category).label}
                    </span>
                    <h2 className="text-2xl font-bold text-theme-color">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.clubName && (
                      <p className="text-sm opacity-60 text-theme-color">
                        by {selectedEvent.clubName}
                      </p>
                    )}
                  </div>
                  {selectedEvent.registrationType === 'paid' && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">₹{selectedEvent.ticketPrice}</p>
                      <p className="text-xs opacity-60 text-theme-color">
                        per ticket
                      </p>
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="grid gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-theme-color">
                        {formatDate(selectedEvent.startDate)}
                      </p>
                      <p className="text-sm opacity-60 text-theme-color">
                        {formatTime(selectedEvent.startDate)} - {formatTime(selectedEvent.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-theme-color">
                        {selectedEvent.venue?.isOnline ? '🌐 Online Event' : selectedEvent.venue?.name}
                      </p>
                      {selectedEvent.venue?.address && (
                        <p className="text-sm opacity-60 text-theme-color">
                          {selectedEvent.venue.address}
                        </p>
                      )}
                      {selectedEvent.venue?.onlineLink && (
                        <a
                          href={selectedEvent.venue.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 flex items-center gap-1"
                        >
                          Join Online <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Users className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-theme-color">
                        {selectedEvent.attendeeCount || 0} going • {selectedEvent.interestedCount || 0}{' '}
                        interested
                      </p>
                      {selectedEvent.maxAttendees && (
                        <p className="text-sm opacity-60 text-theme-color">
                          {selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0)} spots left
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-theme-color">
                    About
                  </h3>
                  <p
                    className="text-sm opacity-80 whitespace-pre-wrap text-theme-color"
                  >
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Organizer */}
                <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm opacity-60 mb-1 text-theme-color">
                    Organized by
                  </p>
                  <p className="font-medium text-theme-color">
                    {selectedEvent.organizer?.name || selectedEvent.organizer?.username}
                  </p>
                  <p className="text-sm opacity-60 text-theme-color">
                    {selectedEvent.organizerCollege?.name}
                  </p>
                </div>

                {/* RSVP Buttons */}
                <div className="flex gap-3">
                  <Button
                    className={`flex-1 ${
                      selectedEvent.isGoing
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-500'
                    } text-white`}
                    onClick={() =>
                      handleRSVP(selectedEvent._id, selectedEvent.isGoing ? 'not-going' : 'going')
                    }
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {selectedEvent.isGoing ? "You're Going!" : "I'm Going"}
                  </Button>
                  <Button
                    variant="outline"
                    className={selectedEvent.isInterested ? 'bg-yellow-100 border-yellow-500' : ''}
                    onClick={() =>
                      handleRSVP(
                        selectedEvent._id,
                        selectedEvent.isInterested ? 'not-going' : 'interested',
                      )
                    }
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedEvent.isInterested ? 'fill-yellow-500 text-yellow-500' : ''
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card
            className="w-full max-w-2xl p-6 rounded-xl my-8 bg-theme-background"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-theme-color">
                🎉 Create Event
              </h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-6 h-6 text-theme-color" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1 text-theme-color">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Annual Tech Fest 2025"
                  className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                />
              </div>

              {/* Category & Club */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Category *
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Club/Organization
                  </label>
                  <input
                    type="text"
                    value={eventForm.clubName}
                    onChange={(e) => setEventForm((f) => ({ ...f, clubName: e.target.value }))}
                    placeholder="e.g., Coding Club"
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-theme-color">
                  Description *
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Tell people what your event is about..."
                  rows={4}
                  className="w-full p-3 rounded-lg resize-none bg-theme-background text-theme-color border border-theme-color"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) =>
                      setEventForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                        endDate: f.endDate || e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={eventForm.isOnline}
                    onChange={(e) => setEventForm((f) => ({ ...f, isOnline: e.target.checked }))}
                  />
                  <label
                    htmlFor="isOnline"
                    className="text-sm text-theme-color"
                  >
                    This is an online event
                  </label>
                </div>

                {eventForm.isOnline ? (
                  <input
                    type="url"
                    value={eventForm.onlineLink}
                    onChange={(e) => setEventForm((f) => ({ ...f, onlineLink: e.target.value }))}
                    placeholder="Meeting link (Zoom, Meet, etc.)"
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={eventForm.venueName}
                      onChange={(e) => setEventForm((f) => ({ ...f, venueName: e.target.value }))}
                      placeholder="Venue name *"
                      className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                    />
                    <input
                      type="text"
                      value={eventForm.venueAddress}
                      onChange={(e) => setEventForm((f) => ({ ...f, venueAddress: e.target.value }))}
                      placeholder="Address (optional)"
                      className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                    />
                  </div>
                )}
              </div>

              {/* Registration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Registration Type
                  </label>
                  <select
                    value={eventForm.registrationType}
                    onChange={(e) =>
                      setEventForm((f) => ({ ...f, registrationType: e.target.value }))
                    }
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="invite-only">Invite Only</option>
                  </select>
                </div>
                {eventForm.registrationType === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-theme-color">
                      Ticket Price (₹)
                    </label>
                    <input
                      type="number"
                      value={eventForm.ticketPrice}
                      onChange={(e) => setEventForm((f) => ({ ...f, ticketPrice: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-color">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    value={eventForm.maxAttendees}
                    onChange={(e) => setEventForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full p-3 rounded-lg bg-theme-background text-theme-color border border-theme-color"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex justify-end gap-3 mt-6 pt-4 border-t border-theme-color"
            >
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={
                  !eventForm.title ||
                  !eventForm.description ||
                  !eventForm.startDate ||
                  !eventForm.startTime ||
                  !eventForm.endDate ||
                  !eventForm.endTime ||
                  (!eventForm.isOnline && !eventForm.venueName)
                }
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                Create Event
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Events;
