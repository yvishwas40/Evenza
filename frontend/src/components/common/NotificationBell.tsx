import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, MessageSquare } from 'lucide-react';
import { messageAPI, userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  subject: string;
  content: string;
  sentAt: string;
  event: {
    _id: string;
    title: string;
  };
  sender: {
    name: string;
  };
}

const NotificationBell: React.FC = () => {
  const { user, isUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [seenMessages, setSeenMessages] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (isUser && user) {
      // initial load
      loadUnreadMessages();
      // Poll for new messages every 30 seconds
      const interval = window.setInterval(loadUnreadMessages, 30000);
      pollRef.current = interval;

      // Setup socket connection to receive real-time announcements
      setupSocket();

      return () => {
        // cleanup
        if (pollRef.current) {
          clearInterval(pollRef.current);
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }

    // cleanup when user logs out
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUser, user]);

  const loadUnreadMessages = async () => {
    if (!isUser || !user) return;

    try {
      setLoading(true);
      const response = await messageAPI.getUserUnreadMessages();
      // ensure consistent shape
      const msgs: Message[] = Array.isArray(response.data) ? response.data : [];
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading unread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = async () => {
    if (!isUser || !user) return;

    try {
      // Fetch user's registrations to determine which event rooms to join
      const regsRes = await userAPI.getMyRegistrations();
      const regs = Array.isArray(regsRes.data) ? regsRes.data : [];

      // Extract event ids safely (handle populated event object or raw id)
      const eventIds = Array.from(
        new Set(
          regs
            .map((r: any) => {
              if (!r) return null;
              if (r.event) {
                // event may be populated object or just an id
                return r.event._id ? String(r.event._id) : String(r.event);
              }
              return null;
            })
            .filter(Boolean)
        )
      );

      // Determine socket URL (strip /api if present)
      const base = import.meta.env.VITE_API_URL || 'https://evenza-sjtt.onrender.com/api';
      const SOCKET_URL = base.replace(/\/api\/?$/, '');

      const socket = io(SOCKET_URL, {
        auth: {},
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        // join event rooms
        if (eventIds.length > 0) {
          socket.emit('join-events', eventIds);
        }
      });

      socket.on('new-announcement', (payload: any) => {
        const newAnnouncements = payload?.announcements || [];
        if (!Array.isArray(newAnnouncements) || newAnnouncements.length === 0) return;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => String(m._id)));
          const filtered = newAnnouncements
            .map((a: any) => ({ ...a, _id: String(a._id) }))
            .filter((a: any) => !existingIds.has(a._id));
          // Prepend new announcements
          const merged = [...filtered, ...prev];
          // Keep only latest 50
          return merged.slice(0, 50);
        });
      });

      socket.on('disconnect', () => {
        // noop
      });

    } catch (err) {
      console.error('Socket setup failed', err);
    }
  };

  const markAsSeen = (messageIds: string[]) => {
    const newSeen = new Set([...seenMessages, ...messageIds]);
    setSeenMessages(newSeen);

    // Persist mark-as-seen (fire-and-forget)
    messageAPI.markMessagesSeen(messageIds).catch(console.error);
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && messages.length > 0) {
      // Mark all visible messages as seen
      const unseenMessageIds = messages.filter((msg) => !seenMessages.has(msg._id)).map((msg) => msg._id);
      if (unseenMessageIds.length > 0) {
        markAsSeen(unseenMessageIds);
      }
    }
  };

  // Don't show for non-users
  if (!isUser || !user) {
    return null;
  }

  const unseenCount = messages.filter((msg) => !seenMessages.has(msg._id)).length;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={handleDropdownToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No new announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((message) => {
                  const isUnseen = !seenMessages.has(message._id);
                  return (
                    <div 
                      key={message._id} 
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        isUnseen ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          isUnseen ? 'bg-blue-500' : 'bg-transparent'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {message.event.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(message.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                          <h4 className="text-sm font-medium text-gray-800 mt-1">
                            {message.subject}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {message.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            From: {message.sender.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const allMessageIds = messages.map((msg) => msg._id);
                  markAsSeen(allMessageIds);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
