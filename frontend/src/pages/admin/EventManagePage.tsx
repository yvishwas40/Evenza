import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, DollarSign, QrCode, MessageSquare, 
  Calendar, MapPin, Settings, Download,
  CheckCircle, AlertCircle, TrendingUp, Trash2
} from 'lucide-react';
import { eventAPI, attendeeAPI, checkinAPI, messageAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QRScanner from '../../components/common/QRScanner';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  attendeeCount: number;
  checkInCount: number;
  status: string;
  isPaid: boolean;
  ticketPrice: number;
}

interface Attendee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  registrationId: string;
  checkInStatus: string;
  paymentStatus: string;
  createdAt: string;
}

const EventManagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventData(id);
    }
  }, [id]);

  const loadEventData = async (eventId: string) => {
    try {
      const [eventResponse, attendeesResponse, statsResponse] = await Promise.all([
        eventAPI.getEvents(),
        attendeeAPI.getEventAttendees(eventId),
        eventAPI.getEventStats(eventId)
      ]);

      const currentEvent = eventResponse.data.find((e: Event) => e._id === eventId);
      setEvent(currentEvent);
      setAttendees(attendeesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    setScannerLoading(true);
    try {
      const response = await checkinAPI.qrCheckin({
        qrData,
        device: 'Admin Dashboard'
      });
      
      toast.success(`Check-in successful: ${response.data.attendee.name}`);
      setShowQRScanner(false);
      
      // Reload data
      if (id) {
        loadEventData(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleManualCheckin = async (attendeeId: string) => {
    try {
      await checkinAPI.manualCheckin({ attendeeId });
      toast.success('Manual check-in successful');
      
      // Reload data
      if (id) {
        loadEventData(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    
    setDeleteLoading(true);
    try {
      await eventAPI.deleteEvent(id);
      toast.success('Event deleted successfully');
      navigate('/admin/events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading event data...</p>
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
          <Link 
            to="/admin/events"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/events"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Events</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{event.attendeeCount}/{event.capacity}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan QR</span>
              </button>
              
              <Link
                to={`/admin/events/${id}/edit`}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Edit</span>
              </Link>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRegistrations}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check-ins</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.checkInCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {event.isPaid && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${stats.paidAttendees * event.ticketPrice}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacity Filled</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.capacityFilled}%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: Calendar },
                { id: 'attendees', name: 'Attendees', icon: Users },
                { id: 'checkin', name: 'Check-in', icon: QrCode },
                { id: 'messaging', name: 'Messaging', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab event={event} stats={stats} />
            )}
            
            {activeTab === 'attendees' && (
              <AttendeesTab 
                attendees={attendees} 
                onManualCheckin={handleManualCheckin}
              />
            )}
            
            {activeTab === 'checkin' && (
              <CheckinTab 
                eventId={event._id}
                onQRScan={() => setShowQRScanner(true)}
              />
            )}
            
            {activeTab === 'messaging' && (
              <MessagingTab eventId={event._id} />
            )}
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
            isLoading={scannerLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Event</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{event?.title}"? This action cannot be undone and will also delete all associated registrations, check-ins, and payments.
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleteLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Event</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{ event: Event; stats: any }> = ({ event, stats }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Description</h3>
      <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
    </div>

    {stats && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.checkInCount}</div>
            <div className="text-sm text-gray-600">Checked In</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.paidAttendees}</div>
            <div className="text-sm text-gray-600">Paid</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.surveyCompleted}</div>
            <div className="text-sm text-gray-600">Survey Done</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const AttendeesTab: React.FC<{ 
  attendees: Attendee[]; 
  onManualCheckin: (id: string) => void;
}> = ({ attendees, onManualCheckin }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Attendees ({attendees.length})
      </h3>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
        <Download className="h-4 w-4" />
        <span>Export</span>
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Registration ID</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Payment</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => (
            <tr key={attendee._id} className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{attendee.name}</div>
              </td>
              <td className="py-3 px-4 text-gray-600">{attendee.email}</td>
              <td className="py-3 px-4 font-mono text-sm">{attendee.registrationId}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  attendee.checkInStatus === 'checked_in' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {attendee.checkInStatus === 'checked_in' ? 'Checked In' : 'Not Checked In'}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  attendee.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : attendee.paymentStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {attendee.paymentStatus}
                </span>
              </td>
              <td className="py-3 px-4">
                {attendee.checkInStatus !== 'checked_in' && (
                  <button
                    onClick={() => onManualCheckin(attendee._id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Check In
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CheckinTab: React.FC<{ 
  eventId: string; 
  onQRScan: () => void;
}> = ({ eventId, onQRScan }) => (
  <div className="space-y-6">
    <div className="text-center">
      <QrCode className="h-16 w-16 text-blue-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Check-in</h3>
      <p className="text-gray-600 mb-6">
        Use the QR scanner to quickly check-in attendees
      </p>
      <button
        onClick={onQRScan}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Open QR Scanner
      </button>
    </div>
  </div>
);

const MessagingTab: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getEventMessages(eventId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.subject.trim() || !newMessage.content.trim()) {
      toast.error('Please fill in both subject and content');
      return;
    }

    setSending(true);
    try {
      await messageAPI.createAnnouncement({
        eventId,
        subject: newMessage.subject,
        content: newMessage.content
      });
      
      toast.success('Announcement posted successfully!');
      setNewMessage({ subject: '', content: '' });
      setShowCreateMessage(false);
      fetchMessages(); // Refresh messages list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Event Announcements</h3>
          <p className="text-gray-600">Post announcements that will be visible to all attendees</p>
        </div>
        <button
          onClick={() => setShowCreateMessage(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Create Message Form */}
      {showCreateMessage && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">New Announcement</h4>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter announcement subject"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your announcement content here..."
                required
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateMessage(false);
                  setNewMessage({ subject: '', content: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {sending && <LoadingSpinner size="sm" />}
                <span>Post Announcement</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Announcements Yet</h3>
            <p className="text-gray-600">
              Create your first announcement to keep attendees informed
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message._id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {message.subject}
                  </h4>
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Posted on {new Date(message.sentAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(message.sentAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    message.type === 'broadcast' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.type === 'broadcast' ? 'Announcement' : message.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventManagePage;