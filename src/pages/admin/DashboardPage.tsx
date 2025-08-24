import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, DollarSign, TrendingUp, Plus, 
  BarChart3, Clock, MapPin, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

interface Event {
  _id: string;
  title: string;
  date: string;
  venue: string;
  attendeeCount: number;
  capacity: number;
  checkInCount: number;
  status: string;
  isPaid: boolean;
  ticketPrice: number;
}

const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await eventAPI.getEvents();
      const eventsData = response.data;
      setEvents(eventsData);
      
      // Calculate stats
      const totalEvents = eventsData.length;
      const totalAttendees = eventsData.reduce((sum: number, event: Event) => sum + event.attendeeCount, 0);
      const totalRevenue = eventsData.reduce((sum: number, event: Event) => 
        sum + (event.isPaid ? event.attendeeCount * event.ticketPrice : 0), 0);
      const upcomingEvents = eventsData.filter((event: Event) => new Date(event.date) > new Date()).length;
      
      setStats({ totalEvents, totalAttendees, totalRevenue, upcomingEvents });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {admin?.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your events today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>All time events</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAttendees}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>Registered users</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>From paid events</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>Events ahead</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
                  <Link
                    to="/admin/events"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No events created yet</p>
                    <Link
                      to="/admin/events/create"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Event
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => {
                      const eventDate = new Date(event.date);
                      const isUpcoming = eventDate > new Date();
                      const attendanceRate = (event.attendeeCount / event.capacity) * 100;

                      return (
                        <div key={event._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className={`p-2 rounded-lg ${
                            isUpcoming ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            {isUpcoming ? (
                              <Calendar className="h-5 w-5 text-green-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/admin/events/${event._id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors block"
                            >
                              {event.title}
                            </Link>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{eventDate.toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.venue}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {event.attendeeCount}/{event.capacity}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attendanceRate.toFixed(0)}% filled
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Create Event Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Ready to create an event?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Set up a new event with registration, payments, and check-ins
              </p>
              <Link
                to="/admin/events/create"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Event</span>
              </Link>
            </div>

            {/* Event Status Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Published</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {events.filter(e => e.status === 'published').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {events.filter(e => e.status === 'draft').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Ongoing</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {events.filter(e => e.status === 'ongoing').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {events.filter(e => e.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <BarChart3 className="h-3 w-3 text-blue-600" />
                  </div>
                  <p>Use analytics to track event performance and attendee engagement</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <Users className="h-3 w-3 text-green-600" />
                  </div>
                  <p>Send reminder emails to boost attendance rates</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  </div>
                  <p>Test QR codes before the event for smooth check-ins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;