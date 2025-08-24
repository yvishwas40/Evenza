import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, Users, DollarSign, Globe, 
  ArrowLeft, CheckCircle, AlertCircle, Share2, Heart
} from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RegistrationModal from '../../components/registration/RegistrationModal';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  title: string;
  description: string;
  poster?: string;
  date: string;
  endDate?: string;
  time: string;
  venue: string;
  isVirtual: boolean;
  zoomLink?: string;
  capacity: number;
  attendeeCount: number;
  ticketPrice: number;
  isPaid: boolean;
  agenda: Array<{
    time: string;
    title: string;
    description?: string;
    speaker?: string;
  }>;
  tags: string[];
  organizer: {
    name: string;
    organization?: string;
  };
}

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      const response = await eventAPI.getPublicEvent(eventId);
      console.log('Loaded event:', response.data);
      setEvent(response.data);
    } catch (error) {
      toast.error('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
          <Link 
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
        </div>
      </div>
    );
  }

  const posterUrl = event.poster?.startsWith('http')
    ? event.poster
    : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${event.poster || ''}`;

  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const formattedTime = new Date(`${event.date}T${event.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUpcoming = eventDate > new Date();
  const availableSpots = event.capacity - event.attendeeCount;
  const isAlmostFull = availableSpots <= event.capacity * 0.1;
  const isFull = availableSpots === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-indigo-800 overflow-hidden">
        {event.poster ? (
          <img
            src={posterUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center text-white text-xl font-bold">
            No Image
          </div>
        )}

        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
          <div className="text-white max-w-4xl">
            {/* Navigation */}
            <Link 
              to="/"
              className="inline-flex items-center space-x-2 text-blue-200 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Events</span>
            </Link>

            {/* Event Title & Basic Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.isVirtual 
                      ? 'bg-green-500 bg-opacity-20 text-green-200' 
                      : 'bg-blue-500 bg-opacity-20 text-blue-200'
                  }`}>
                    {event.isVirtual ? 'Virtual Event' : 'In-Person Event'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.isPaid 
                      ? 'bg-orange-500 bg-opacity-20 text-orange-200' 
                      : 'bg-green-500 bg-opacity-20 text-green-200'
                  }`}>
                    {event.isPaid ? `$${event.ticketPrice}` : 'Free'}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {event.title}
                </h1>

                <div className="flex items-center text-lg text-blue-100 space-x-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 ml-6">
                <button
                  onClick={handleShare}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200"
                  title="Share Event"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                {event.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Agenda */}
            {event.agenda && event.agenda.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Agenda</h2>
                <div className="space-y-4">
                  {event.agenda.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium min-w-max">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        )}
                        {item.speaker && (
                          <p className="text-blue-600 text-sm font-medium">Speaker: {item.speaker}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Topics</h2>
                <div className="flex flex-wrap gap-3">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {event.isPaid ? `$${event.ticketPrice}` : 'Free'}
                </div>
                {event.isPaid && (
                  <p className="text-gray-600 text-sm">per ticket</p>
                )}
              </div>

              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Availability</span>
                  <span>{event.attendeeCount}/{event.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${isAlmostFull ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${(event.attendeeCount / event.capacity) * 100}%` }}
                  ></div>
                </div>
                {isAlmostFull && !isFull && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    Only {availableSpots} spots remaining!
                  </p>
                )}
              </div>

              {/* Registration Button */}
              <button
                onClick={() => setShowRegistration(true)}
                disabled={isFull}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  isFull
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isAlmostFull
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isFull ? 'Event Full' : 'Register Now'}
              </button>

              {!isFull && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  {event.isPaid ? 'Secure payment required' : 'Free registration'}
                </p>
              )}
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Date & Time</p>
                    <p className="text-gray-600 text-sm">
                      {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-gray-600 text-sm">{formattedTime}</p>
                    {endDate && (
                      <p className="text-gray-600 text-sm">
                        Ends: {endDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{event.isVirtual ? 'Virtual Location' : 'Venue'}</p>
                    <p className="text-gray-600 text-sm">{event.venue}</p>
                    {event.isVirtual && event.zoomLink && (
                      <p className="text-blue-600 text-sm mt-1">
                        <a href={event.zoomLink} target="_blank" rel="noopener noreferrer">Join Zoom Meeting</a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Organizer</p>
                    <p className="text-gray-600 text-sm">{event.organizer.name}</p>
                    {event.organizer.organization && (
                      <p className="text-gray-600 text-sm">{event.organizer.organization}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationModal
          event={event}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
};

export default EventDetailsPage;
