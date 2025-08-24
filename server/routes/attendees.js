import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendConfirmationEmail, sendReminderEmail } from '../utils/email.js';
import { syncToGoogleSheets } from '../utils/gsheet.js';

const router = express.Router();

// Register for event (public)
router.post('/register/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, organization, designation, dietaryRequirements, emergencyContact, attendanceType, userId } = req.body;

    // Check if event exists and is published
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not available for registration' });
    }

    // Check capacity
    if (event.attendeeCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if email already registered for this event
    const existingAttendee = await Attendee.findOne({ event: eventId, email });
    if (existingAttendee) {
      return res.status(400).json({ message: 'Email already registered for this event' });
    }

    // Generate unique registration ID
    const registrationId = `REG-${event.title.substring(0, 3).toUpperCase()}-${Date.now()}`;

    // Generate QR code
    const qrData = {
      eventId,
      registrationId,
      attendeeEmail: email,
      timestamp: new Date().toISOString()
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create attendee
    const attendee = new Attendee({
      event: eventId,
      user: userId || null, // Associate with user if logged in
      name,
      email,
      phone,
      organization,
      designation,
      dietaryRequirements,
      emergencyContact,
      registrationId,
      qrCode,
      attendanceType: attendanceType || 'physical',
      paymentStatus: event.isPaid ? 'pending' : 'completed'
    });

    await attendee.save();

    // Update event attendee count
    event.attendeeCount += 1;
    await event.save();

    // Send confirmation email
    await sendConfirmationEmail(attendee, event);

    // Sync to Google Sheets
    await syncToGoogleSheets(event, attendee, 'registration');

    res.status(201).json({
      message: 'Registration successful',
      registrationId,
      paymentRequired: event.isPaid,
      attendee: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        registrationId,
        qrCode
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all attendees for an event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendees = await Attendee.find({ event: eventId })
      .sort({ createdAt: -1 });

    res.json(attendees);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single attendee
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id)
      .populate('event', 'title date venue organizer');

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    // Check if organizer owns this event
    if (attendee.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(attendee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update attendee
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id)
      .populate('event', 'organizer');

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    // Check if organizer owns this event
    if (attendee.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(attendee, req.body);
    await attendee.save();

    res.json(attendee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete attendee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id)
      .populate('event', 'organizer');

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    // Check if organizer owns this event
    if (attendee.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await attendee.deleteOne();

    // Update event attendee count
    await Event.findByIdAndUpdate(attendee.event._id, {
      $inc: { attendeeCount: -1 }
    });

    res.json({ message: 'Attendee deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send reminder emails
router.post('/reminder/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { subject, message } = req.body;

    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendees = await Attendee.find({ 
      event: eventId, 
      paymentStatus: 'completed' 
    });

    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        await sendReminderEmail(attendee, event, { subject, message });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${attendee.email}:`, error);
      }
    }

    res.json({ 
      message: `Reminder sent to ${sentCount} attendees`,
      total: attendees.length,
      sent: sentCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;