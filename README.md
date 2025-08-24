# Evanza Event Management

A full-stack event management platform with admin and attendee features, real-time messaging, payments, check-in, and Google Sheets integration.

---

## 🚀 Live Demo

- **Frontend:** [[https://your-backend.onrender.com/api](https://evanza-2pms.vercel.app)]
- **Backend API:** [[https://your-backend.onrender.com/api](https://evenza-sjtt.onrender.com/api)]

---

## ✨ Features

- **Event Management:** Create, update, delete, and view events (admin & public views)
- **Attendee Registration:** Register for events, manage attendees, send reminders
- **Payments:** Stripe integration for event payments, refunds, and payment status
- **Check-in System:** QR and manual check-in/out, real-time stats
- **Messaging:** Broadcasts, announcements, surveys, unread message tracking
- **Google Sheets Integration:** Sync event data with Google Sheets
- **User Authentication:** Secure login/register for admins and users
- **Admin Dashboard:** Manage events, attendees, payments, and messages

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/evanza-eventmanagement.git
cd evanza-eventmanagement
```

### 2. Environment Variables

Create a `.env` file in the root and in `/server` with the following (example):

**Frontend (`.env`):**
```
VITE_API_URL=https://your-backend.onrender.com/api
```

**Backend (`server/.env`):**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
...
```

### 3. Install Dependencies

```bash
npm install
cd server && npm install
```

### 4. Run Locally

```bash
# In project root
npm run dev
```
This will start both frontend and backend (using `concurrently`).

---

## 🌐 Deployment

- **Frontend:** Deploy `/src` (Vite/React) to [Vercel](https://vercel.com)
- **Backend:** Deploy `/server` (Node/Express) to [Render](https://render.com) or [Railway](https://railway.app)

---

## 📚 API Endpoints

All endpoints are prefixed with your backend URL:  
`https://your-backend.onrender.com/api`

### **Events**
- `GET /events/public` — List public events
- `GET /events/public/all` — List all public events
- `GET /events/public/:id` — Get public event details
- `GET /events/public/search?q=...&type=...` — Search events
- `GET /events/debug/all` — Debug: all events (admin)
- `GET /events` — List all events (admin)
- `POST /events` — Create event (admin)
- `PUT /events/:id` — Update event (admin)
- `DELETE /events/:id` — Delete event (admin)
- `GET /events/:id/stats` — Event stats

### **Attendees**
- `POST /attendees/register/:eventId` — Register for event
- `GET /attendees/event/:eventId` — List event attendees
- `PUT /attendees/:id` — Update attendee
- `DELETE /attendees/:id` — Delete attendee
- `POST /attendees/reminder/:eventId` — Send reminder

### **Payments**
- `POST /payments/create-intent` — Create Stripe payment intent
- `POST /payments/process` — Process payment
- `GET /payments/status/:attendeeId/:eventId` — Payment status
- `GET /payments/event/:eventId` — Event payments
- `POST /payments/refund/:paymentId` — Refund payment

### **Check-in**
- `POST /checkin/qr` — QR code check-in
- `POST /checkin/manual` — Manual check-in
- `POST /checkin/checkout/:attendeeId` — Checkout attendee
- `GET /checkin/stats/:eventId` — Check-in stats

### **Messages**
- `POST /messages/broadcast` — Send broadcast
- `POST /messages/survey` — Send survey
- `GET /messages/event/:eventId` — Event messages
- `POST /messages/survey-completed/:attendeeId` — Complete survey
- `POST /messages/announcement` — Create announcement
- `GET /messages/public/:eventId` — Public messages
- `GET /messages/user/unread` — User unread messages
- `POST /messages/user/mark-seen` — Mark messages as seen

### **Google Sheets**
- `POST /gsheet/setup/:eventId` — Setup integration
- `GET /gsheet/data/:eventId` — Get sheet data
- `GET /gsheet/appscript-code/:eventId` — Get App Script code

### **User Authentication**
- `POST /auth/user/login` — User login
- `POST /auth/user/register` — User register
- `GET /auth/user/me` — Get user profile

### **User Registrations**
- `GET /user/registrations` — My registrations
- `GET /user/registrations/:registrationId` — Registration details
- `GET /user/registration-status/:eventId` — Check registration status

---

## 🧑‍💻 Usage

- **Admins:** Login to the dashboard to manage events, attendees, payments, and messages.
- **Attendees:** Register for events,
