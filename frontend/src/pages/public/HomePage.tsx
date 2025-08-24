import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowRight, Search, Filter } from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  poster?: string;
  date?: string;
  time?: string;
  venue?: string;
  isVirtual?: boolean;
  capacity?: number;
  attendeeCount?: number;
  ticketPrice?: number;
  isPaid?: boolean;
  tags?: string[];
  organizer?: {
    name?: string;
    organization?: string;
  };
}

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid' | 'virtual' | 'physical'>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      console.log("Starting to load events...");
      
      // Try to get all published events first (including past ones for testing)
      const response = await eventAPI.getPublicEvents();
      console.log("API response:", response);
      console.log("API response data:", response.data);
      console.log("API response status:", response.status);

      // ✅ Normalize to array no matter what backend sends
      const normalizedEvents = Array.isArray(response.data)
        ? response.data
        : response.data?.events || [];

      console.log("Normalized events:", normalizedEvents);
      console.log("Events length:", normalizedEvents.length);

      // If no events found, try to get all events (including past ones)
      if (normalizedEvents.length === 0) {
        console.log("No upcoming events found, trying to get all events...");
        try {
          const allEventsResponse = await eventAPI.getAllPublicEvents();
          console.log("All events response:", allEventsResponse);
          console.log("All events data:", allEventsResponse.data);
          
          if (Array.isArray(allEventsResponse.data)) {
            console.log("Setting events from all events:", allEventsResponse.data);
            setEvents(allEventsResponse.data);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback API call failed:', fallbackError);
        }
        
        // If still no events, try debug route
        try {
          console.log("Still no events, trying debug route...");
          const debugResponse = await eventAPI.debugAllEvents();
          console.log("Debug response:", debugResponse);
          console.log("Debug data:", debugResponse.data);
          
          if (debugResponse.data.events && Array.isArray(debugResponse.data.events)) {
            console.log("Setting events from debug route:", debugResponse.data.events);
            setEvents(debugResponse.data.events);
            return;
          }
        } catch (debugError) {
          console.error('Debug route failed:', debugError);
        }
      }

      console.log("Setting events from main response:", normalizedEvents);
      setEvents(normalizedEvents);
    } catch (error: any) {
      console.error('Error loading events:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Protect filter logic against non-array
  const filteredEvents = Array.isArray(events)
    ? events.filter(event => {
        // console.log('Filtering event:', event.title || 'Untitled', 'Search term:', searchTerm, 'Filter type:', filterType);
        
        const matchesSearch =
          (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.tags && Array.isArray(event.tags) && event.tags.some(tag => (tag || '').toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesFilter =
          filterType === 'all' ||
          (filterType === 'free' && !(event.isPaid || false)) ||
          (filterType === 'paid' && (event.isPaid || false)) ||
          (filterType === 'virtual' && (event.isVirtual || false)) ||
          (filterType === 'physical' && !(event.isVirtual || false));

        const result = matchesSearch && matchesFilter;
        // console.log('Event matches:', event.title || 'Untitled', 'Search:', matchesSearch, 'Filter:', matchesFilter, 'Result:', result);
        
        return result;
      })
    : [];

  // Debug logging (commented out for production)
  // console.log('HomePage render - Loading:', loading, 'Events:', events, 'Filtered events:', filteredEvents);
  // console.log('Search term:', searchTerm, 'Filter type:', filterType);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Events
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join exciting events, connect with people, and learn new things
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search events, topics, or organizers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            {[
              { key: 'all', label: 'All Events' },
              { key: 'free', label: 'Free' },
              { key: 'paid', label: 'Paid' },
              { key: 'virtual', label: 'Virtual' },
              { key: 'physical', label: 'In-Person' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {searchTerm || filterType !== 'all' ? 'Search Results' : 'Upcoming Events'}
            </h2>
            <p className="text-gray-600 mt-2">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </p>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all'
                  ? "Try adjusting your search or filter criteria"
                  : "No events are currently available. Check back later!"}
              </p>
              {(searchTerm || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <EventCard key={event._id || `event-${index}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Complete EventCard component
const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  // console.log('Rendering EventCard for:', event.title || 'Untitled', 'Event data:', event);
  
  // Safely handle potentially undefined fields
  const attendeeCount = event.attendeeCount || 0;
  const capacity = event.capacity || 0;
  const availableSpots = capacity - attendeeCount;
  const isAlmostFull = availableSpots <= capacity * 0.1;
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'Date not available';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString || 'undefined', error);
      return 'Date not available';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            {/* Event Image */}
      {event.poster && event.poster.trim() !== '' ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.poster.startsWith('http') ? event.poster : `${import.meta.env.VITE_API_URL || 'https://evenza-sjtt.onrender.com'}${event.poster}`}
            alt={event.title || 'Event poster'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                console.error('Failed to load image:', event.poster || 'No poster URL');
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
          />
          {event.isVirtual && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Virtual
            </div>
          )}
        </div>
      ) : null}
      
      {/* Fallback image if no poster or if poster fails to load */}
      <div className={`h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${event.poster && event.poster.trim() !== '' ? 'hidden' : ''}`}>
        <Calendar className="h-16 w-16 text-blue-400" />
      </div>

      {/* Event Content */}
      <div className="p-6">
        {/* Event Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          {event.isPaid ? (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              ${event.ticketPrice || 0}
            </span>
          ) : (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              Free
            </span>
          )}
          {event.isVirtual && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Virtual
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title || 'Untitled Event'}
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.shortDescription || event.description || 'No description available'}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            {event.time || 'Time not specified'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            {event.venue || 'Venue not specified'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            {event.attendeeCount}/{event.capacity} registered
            {isAlmostFull && (
              <span className="ml-2 text-orange-600 font-medium">Almost Full!</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {event.tags && Array.isArray(event.tags) && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Organizer */}
        <div className="text-sm text-gray-500 mb-4">
          Organized by {event.organizer?.name || 'Unknown'}
          {event.organizer?.organization && ` (${event.organizer.organization})`}
        </div>

        {/* Action Button */}
        <Link
          to={`/event/${event._id}`}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center group-hover:bg-blue-700"
        >
          View Details
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
