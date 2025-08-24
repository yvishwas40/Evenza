import express from 'express';
import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's event registrations
router.get('/registrations', authenticateToken, async (req, res) => {
  try {
    // Find all attendees for this user
    const registrations = await Attendee.find({ 
      email: req.user.email || '',
      // You might want to add a userId field to Attendee model for better linking
    })
    .populate('event', 'title description date time venue isVirtual poster isPaid ticketPrice')
    .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get specific registration details
router.get('/registrations/:id', authenticateToken, async (req, res) => {
  try {
    const registration = await Attendee.findById(req.params.id)
      .populate('event', 'title description date time venue isVirtual poster isPaid ticketPrice organizer');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify this registration belongs to the current user
    if (registration.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(registration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check if user is registered for a specific event
router.get('/registration-status/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find registration for this user and event
    const registration = await Attendee.findOne({ 
      event: eventId,
      email: req.user.email
    });

    if (!registration) {
      return res.json({ 
        isRegistered: false,
        registration: null 
      });
    }

    // Get event details to check registration deadline
    const event = await Event.findById(eventId, 'registrationDeadline');
    const now = new Date();
    const deadline = event?.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const canUpdate = !deadline || now <= deadline;

    res.json({
      isRegistered: true,
      registration: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        registrationDate: registration.createdAt,
        canUpdate: canUpdate,
        status: registration.status || 'confirmed'
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
