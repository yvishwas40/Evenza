import express from 'express';
import multer from 'multer';
import path from 'path';
import Event from '../models/Event.js';
import Attendee from '../models/Attendee.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateZoomLink } from '../utils/virtualEvent.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all published events (public)
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ 
      status: 'published',
      date: { $gte: new Date() }
    })
    .populate('organizer', 'name organization')
    .sort({ date: 1 })
    .select('-appScriptUrl -gsheetId');

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single event (public)
router.get('/public/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name organization')
      .select('-appScriptUrl -gsheetId');
    
    if (!event || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all events for admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'name organization')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Get all published events (including past ones)
router.get('/public/all', async (req, res) => {
  try {
    const events = await Event.find({ status: 'published' })
      .populate('organizer', 'name organization')
      .sort({ date: 1 })
      .select('-appScriptUrl -gsheetId');

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search published events by query and/or type
router.get('/public/search', async (req, res) => {
  try {
    const { q, type } = req.query;

    const query = { status: 'published' }; // no ": any"

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type; // e.g., "virtual", "in-person"
    }

    const events = await Event.find(query)
      .populate('organizer', 'name organization')
      .sort({ date: 1 })
      .select('-appScriptUrl -gsheetId');

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new event
router.post('/', authenticateToken, upload.single('poster'), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id,
      poster: req.file ? `/uploads/${req.file.filename}` : null
    };

    // Parse agenda if it's a string
    if (typeof eventData.agenda === 'string') {
      eventData.agenda = JSON.parse(eventData.agenda);
    }

    // Parse tags if it's a string
    if (typeof eventData.tags === 'string') {
      eventData.tags = JSON.parse(eventData.tags);
    }

    // Generate Zoom link for virtual events
    if (eventData.isVirtual) {
      const zoomData = generateZoomLink(eventData.title, eventData.date);
      eventData.zoomLink = zoomData.joinUrl;
      eventData.meetingId = zoomData.meetingId;
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update event
router.put('/:id', authenticateToken, upload.single('poster'), async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.poster = `/uploads/${req.file.filename}`;
    }

    // Parse agenda and tags if they're strings
    if (typeof updateData.agenda === 'string') {
      updateData.agenda = JSON.parse(updateData.agenda);
    }
    if (typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

    // Update Zoom link if event becomes virtual
    if (updateData.isVirtual && !event.zoomLink) {
      const zoomData = generateZoomLink(updateData.title || event.title, updateData.date || event.date);
      updateData.zoomLink = zoomData.joinUrl;
      updateData.meetingId = zoomData.meetingId;
    }

    Object.assign(event, updateData);
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.user.id });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Also delete associated attendees
    await Attendee.deleteMany({ event: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get event statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendees = await Attendee.find({ event: req.params.id });
    
    const stats = {
      totalRegistrations: attendees.length,
      checkInCount: attendees.filter(a => a.checkInStatus === 'checked_in').length,
      paidAttendees: attendees.filter(a => a.paymentStatus === 'completed').length,
      pendingPayments: attendees.filter(a => a.paymentStatus === 'pending').length,
      surveyCompleted: attendees.filter(a => a.surveyCompleted).length,
      capacityFilled: Math.round((attendees.length / event.capacity) * 100)
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;