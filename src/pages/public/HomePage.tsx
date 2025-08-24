import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowRight, Search, Filter } from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  poster?: string;
  date: string;
  time: string;
  venue: string;
  isVirtual: boolean;
  capacity: number;
  attendeeCount: number;
  ticketPrice: number;
  isPaid: boolean;
  tags: string[];
  organizer: {
    name: string;
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
      const response = await eventAPI.getPublicEvents();
      console.log("API response:", response.data);

      // ✅ Normalize to array no matter what backend sends
      const normalizedEvents = Array.isArray(response.data)
        ? response.data
        : response.data?.events || [];

      setEvents(normalizedEvents);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Protect filter logic against non-array
  const filteredEvents = Array.isArray(events)
    ? events.filter(event => {
        const matchesSearch =
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter =
          filterType === 'all' ||
          (filterType === 'free' && !event.isPaid) ||
          (filterType === 'paid' && event.isPaid) ||
          (filterType === 'virtual' && event.isVirtual) ||
          (filterType === 'physical' && !event.isVirtual);

        return matchesSearch && matchesFilter;
      })
    : [];

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
      {/* ... your UI stays the same ... */}
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
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Keep EventCard same as before
const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const availableSpots = event.capacity - event.attendeeCount;
  const isAlmostFull = availableSpots <= event.capacity * 0.1;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* ... existing EventCard code ... */}
    </div>
  );
};

export default HomePage;
