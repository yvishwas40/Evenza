import axios from 'axios';

// Use .env variable or fallback
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const eventAPI = {
  // Public endpoints
  getPublicEvents: () => api.get('/events/public'),
  getAllPublicEvents: () => api.get('/events/public/all'),
  getPublicEvent: (id: string) => api.get(`/events/public/${id}`),
  searchEvents: (query: string, type?: string) =>
    api.get('/events/public/search', { params: { q: query, type } }),
  
  // Debug endpoint
  debugAllEvents: () => api.get('/events/debug/all'),

  // Admin endpoints
  getEvents: () => api.get('/events'),
  createEvent: (data: FormData) =>
    api.post('/events', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateEvent: (id: string, data: FormData) =>
    api.put(`/events/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  getEventStats: (id: string) => api.get(`/events/${id}/stats`),
};


export const attendeeAPI = {
  register: (eventId: string, data: any) =>
    api.post(`/attendees/register/${eventId}`, data),
  getEventAttendees: (eventId: string) =>
    api.get(`/attendees/event/${eventId}`),
  updateAttendee: (id: string, data: any) =>
    api.put(`/attendees/${id}`, data),
  deleteAttendee: (id: string) => api.delete(`/attendees/${id}`),
  sendReminder: (eventId: string, data: any) =>
    api.post(`/attendees/reminder/${eventId}`, data),
};

export const paymentAPI = {
  createIntent: (data: any) => api.post('/payments/create-intent', data),
  processPayment: (data: any) => api.post('/payments/process', data),
  getStatus: (attendeeId: string, eventId: string) =>
    api.get(`/payments/status/${attendeeId}/${eventId}`),
  getEventPayments: (eventId: string) =>
    api.get(`/payments/event/${eventId}`),
  refundPayment: (paymentId: string, data: any) =>
    api.post(`/payments/refund/${paymentId}`, data),
};

export const checkinAPI = {
  qrCheckin: (data: any) => api.post('/checkin/qr', data),
  manualCheckin: (data: any) => api.post('/checkin/manual', data),
  checkout: (attendeeId: string) => api.post(`/checkin/checkout/${attendeeId}`),
  getStats: (eventId: string) => api.get(`/checkin/stats/${eventId}`),
};

export const messageAPI = {
  sendBroadcast: (data: any) => api.post('/messages/broadcast', data),
  sendSurvey: (data: any) => api.post('/messages/survey', data),
  getEventMessages: (eventId: string) =>
    api.get(`/messages/event/${eventId}`),
  completeSurvey: (attendeeId: string) =>
    api.post(`/messages/survey-completed/${attendeeId}`),
  createAnnouncement: (data: any) => api.post('/messages/announcement', data),
  getPublicMessages: (eventId: string) =>
    api.get(`/messages/public/${eventId}`),
  getUserUnreadMessages: () => api.get('/messages/user/unread'),
  markMessagesSeen: (messageIds: string[]) =>
    api.post('/messages/user/mark-seen', { messageIds }),
};

export const gsheetAPI = {
  setupIntegration: (eventId: string, data: any) =>
    api.post(`/gsheet/setup/${eventId}`, data),
  getData: (eventId: string) => api.get(`/gsheet/data/${eventId}`),
  getAppScriptCode: (eventId: string) =>
    api.get(`/gsheet/appscript-code/${eventId}`),
};

export const userAPI = {
  // User authentication
  login: (email: string, password: string) =>
    api.post('/auth/user/login', { email, password }),
  register: (userData: any) => api.post('/auth/user/register', userData),
  getProfile: () => api.get('/auth/user/me'),
  
  // User event registrations
  getMyRegistrations: () => api.get('/user/registrations'),
  getRegistrationDetails: (registrationId: string) => 
    api.get(`/user/registrations/${registrationId}`),
  checkEventRegistration: (eventId: string) =>
    api.get(`/user/registration-status/${eventId}`),
};
