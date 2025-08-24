import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Calendar, MapPin, Users, DollarSign, 
  Edit, Trash2, Eye, Search, Filter, MoreVertical 
} from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  isVirtual: boolean;
  capacity: number;
  attendeeCount: number;
  checkInCount: number;
  ticketPrice: number;
  isPaid: boolean;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventAPI.deleteEvent(eventId);
      setEvents(events.filter(e => e._id !== eventId));
      setShowDeleteModal(null);
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all your events
            </p>
          </div>
          <Link
            to="/admin/events/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">Filter:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {events.length === 0 ? 'No Events Created' : 'No Events Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {events.length === 0 
                ? 'Get started by creating your first event'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {events.length === 0 && (
              <Link
                to="/admin/events/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Event</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onDelete={() => setShowDeleteModal(event._id)}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Event</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this event? This action cannot be undone and will also delete all associated attendee data.
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(showDeleteModal)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EventCard: React.FC<{ 
  event: Event; 
  onDelete: () => void; 
  getStatusColor: (status: string) => string;
}> = ({ event, onDelete, getStatusColor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const attendanceRate = (event.attendeeCount / event.capacity) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
              {event.isPaid && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  ${event.ticketPrice}
                </span>
              )}
              {event.isVirtual && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Virtual
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                <Link
                  to={`/admin/events/${event._id}`}
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </Link>
                <Link
                  to={`/admin/events/${event._id}/edit`}
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Event</span>
                </Link>
                <button
                  onClick={onDelete}
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-red-50 text-sm text-red-600 w-full text-left"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Event</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>{eventDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2 text-red-500" />
            <span className="truncate">{event.venue}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2 text-green-500" />
            <span>{event.attendeeCount}/{event.capacity} registered</span>
          </div>

          {event.isPaid && (
            <div className="flex items-center text-sm text-gray-500">
              <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
              <span>Revenue: ${event.attendeeCount * event.ticketPrice}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Registration</span>
            <span>{attendanceRate.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                attendanceRate > 80 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(attendanceRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <Link
          to={`/admin/events/${event._id}`}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm flex items-center justify-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Manage Event</span>
        </Link>
      </div>
    </div>
  );
};

export default EventsPage;