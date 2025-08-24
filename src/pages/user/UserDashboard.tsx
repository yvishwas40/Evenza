import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, Users, DollarSign, 
  CheckCircle, XCircle, ArrowRight, User
} from 'lucide-react';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface Registration {
  _id: string;
  event: {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    isVirtual: boolean;
    poster?: string;
    isPaid: boolean;
    ticketPrice: number;
  };
  registrationId: string;
  checkInStatus: 'pending' | 'checked_in' | 'checked_out';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const response = await userAPI.getMyRegistrations();
      setRegistrations(response.data);
    } catch (error: any) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(registration => {
    const eventDate = new Date(registration.event.date);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return eventDate >= now;
      case 'past':
        return eventDate < now;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'text-green-600 bg-green-100';
      case 'checked_out':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900"
              >
                Browse Events
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Events</div>
                <div className="text-2xl font-bold text-gray-900">{registrations.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Attended</div>
                <div className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.checkInStatus === 'checked_in' || r.checkInStatus === 'checked_out').length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Upcoming</div>
                <div className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => new Date(r.event.date) >= new Date()).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {[
            { key: 'all', label: 'All Events' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {filteredRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You haven't registered for any events yet."
                  : `No ${filter} events found.`}
              </p>
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Browse Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ) : (
            filteredRegistrations.map((registration) => (
              <div key={registration._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {registration.event.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.checkInStatus)}`}>
                          {registration.checkInStatus.replace('_', ' ').toUpperCase()}
                        </span>
                        {registration.event.isPaid && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.paymentStatus)}`}>
                            Payment: {registration.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {registration.event.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(registration.event.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {registration.event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {registration.event.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Registration ID: {registration.registrationId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered: {formatDate(registration.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex-shrink-0">
                      {registration.event.poster && (
                        <img
                          src={registration.event.poster.startsWith('http') 
                            ? registration.event.poster 
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${registration.event.poster}`}
                          alt={registration.event.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      {registration.event.isPaid && (
                        <span className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${registration.event.ticketPrice}
                        </span>
                      )}
                      {registration.event.isVirtual && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Virtual
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/event/${registration.event._id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      View Event
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
