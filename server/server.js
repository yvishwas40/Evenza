import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import attendeeRoutes from './routes/attendees.js';
import paymentRoutes from './routes/payments.js';
import checkinRoutes from './routes/checkin.js';
import messageRoutes from './routes/messages.js';
import gsheetRoutes from './routes/gsheet.js';
import userRoutes from './routes/user.js';
import connectDB from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendees', attendeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gsheet', gsheetRoutes);
app.use('/api/user', userRoutes);

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// MongoDB connection is handled by connectDB() function

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});