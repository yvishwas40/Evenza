import express from 'express';
import CheckIn from '../models/CheckIn.js';
import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { syncToGoogleSheets } from '../utils/gsheet.js';

const router = express.Router();

// Check-in attendee via QR code
router.post('/qr', authenticateToken, async (req, res) => {
  try {
    const { qrData, location, device } = req.body;
    
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const { eventId, registrationId, attendeeEmail } = parsedData;

    // Find the attendee
    const attendee = await Attendee.findOne({
      event: eventId,
      registrationId,
      email: attendeeEmail
    });

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found or invalid QR code' });
    }

    // Check if event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(403).json({ message: 'Unauthorized access to event' });
    }

    // Check if already checked in
    if (attendee.checkInStatus === 'checked_in') {
      return res.status(400).json({ message: 'Attendee already checked in' });
    }

    // Check payment status for paid events
    if (event.isPaid && attendee.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Create check-in record
    const checkIn = new CheckIn({
      attendee: attendee._id,
      event: eventId,
      checkedInBy: req.user.id,
      device,
      location: location ? {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      } : undefined,
      method: 'qr_scan'
    });

    await checkIn.save();

    // Update attendee status
    attendee.checkInStatus = 'checked_in';
    attendee.checkInTime = new Date();
    await attendee.save();

    // Update event check-in count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { checkInCount: 1 }
    });

    // Sync to Google Sheets
    await syncToGoogleSheets(event, attendee, 'checkin');

    res.json({
      message: 'Check-in successful',
      attendee: {
        name: attendee.name,
        email: attendee.email,
        registrationId: attendee.registrationId,
        checkInTime: attendee.checkInTime
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Manual check-in
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { attendeeId, notes } = req.body;

    const attendee = await Attendee.findById(attendeeId)
      .populate('event', 'organizer isPaid');

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    // Check if event belongs to the organizer
    if (attendee.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to event' });
    }

    // Check if already checked in
    if (attendee.checkInStatus === 'checked_in') {
      return res.status(400).json({ message: 'Attendee already checked in' });
    }

    // Check payment status for paid events
    if (attendee.event.isPaid && attendee.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Create check-in record
    const checkIn = new CheckIn({
      attendee: attendee._id,
      event: attendee.event._id,
      checkedInBy: req.user.id,
      method: 'manual',
      notes
    });

    await checkIn.save();

    // Update attendee status
    attendee.checkInStatus = 'checked_in';
    attendee.checkInTime = new Date();
    await attendee.save();

    // Update event check-in count
    await Event.findByIdAndUpdate(attendee.event._id, {
      $inc: { checkInCount: 1 }
    });

    res.json({
      message: 'Manual check-in successful',
      checkInTime: attendee.checkInTime
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check-out attendee
router.post('/checkout/:attendeeId', authenticateToken, async (req, res) => {
  try {
    const { attendeeId } = req.params;

    const attendee = await Attendee.findById(attendeeId)
      .populate('event', 'organizer');

    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    // Check if event belongs to the organizer
    if (attendee.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to event' });
    }

    if (attendee.checkInStatus !== 'checked_in') {
      return res.status(400).json({ message: 'Attendee not checked in' });
    }

    // Update check-in record
    await CheckIn.findOneAndUpdate(
      { attendee: attendeeId, checkOutTime: { $exists: false } },
      { checkOutTime: new Date() }
    );

    // Update attendee status
    attendee.checkInStatus = 'checked_out';
    attendee.checkOutTime = new Date();
    await attendee.save();

    res.json({
      message: 'Check-out successful',
      checkOutTime: attendee.checkOutTime
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get check-in statistics for an event
router.get('/stats/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const checkIns = await CheckIn.find({ event: eventId })
      .populate('attendee', 'name email registrationId')
      .sort({ checkInTime: -1 });

    const stats = {
      totalCheckIns: checkIns.length,
      uniqueAttendees: new Set(checkIns.map(c => c.attendee._id.toString())).size,
      checkInsToday: checkIns.filter(c => {
        const today = new Date();
        const checkInDate = new Date(c.checkInTime);
        return checkInDate.toDateString() === today.toDateString();
      }).length,
      checkInsByHour: {}
    };

    // Group check-ins by hour
    checkIns.forEach(checkIn => {
      const hour = new Date(checkIn.checkInTime).getHours();
      stats.checkInsByHour[hour] = (stats.checkInsByHour[hour] || 0) + 1;
    });

    res.json({ stats, checkIns });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;