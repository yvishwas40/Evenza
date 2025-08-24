import express from 'express';
import Message from '../models/Message.js';
import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendBroadcastEmail, sendSurveyEmail } from '../utils/email.js';

const router = express.Router();

// Send broadcast message
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    const { eventId, subject, content, targetAudience } = req.body;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Build audience filter
    let audienceFilter = { event: eventId };
    
    switch (targetAudience) {
      case 'paid':
        audienceFilter.paymentStatus = 'completed';
        break;
      case 'checked_in':
        audienceFilter.checkInStatus = 'checked_in';
        break;
      case 'not_checked_in':
        audienceFilter.checkInStatus = 'not_checked_in';
        break;
      default:
        // All attendees
        break;
    }

    const attendees = await Attendee.find(audienceFilter);

    // Create single public broadcast message (no specific recipient)
    const publicMessage = new Message({
      event: eventId,
      sender: req.user.id,
      type: 'broadcast',
      subject,
      content,
      deliveryStatus: 'sent'
    });

    await publicMessage.save();

    // Create MessageRead entries for tracking delivery/read status per attendee
    const MessageRead = (await import('../models/MessageRead.js')).default;
    const readEntries = attendees.map(a => ({
      message: publicMessage._id,
      attendee: a._id
    }));

    try {
      await MessageRead.insertMany(readEntries, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) {
        console.error('Failed to insert MessageRead entries', err);
      }
    }

    // Send emails
    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        await sendBroadcastEmail(attendee, event, { subject, content });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send message to ${attendee.email}:`, error);
      }
    }

    res.json({
      message: `Broadcast sent to ${sentCount}/${attendees.length} attendees`,
      totalRecipients: attendees.length,
      successfulDeliveries: sentCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send post-event survey
router.post('/survey', authenticateToken, async (req, res) => {
  try {
    const { eventId, surveyUrl, customMessage } = req.body;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get attendees who checked in
    const attendees = await Attendee.find({
      event: eventId,
      checkInStatus: 'checked_in',
      surveyCompleted: false
    });

    // Create single public survey message
    const surveyMessage = new Message({
      event: eventId,
      sender: req.user.id,
      type: 'survey',
      subject: `Survey: ${event.title}`,
      content: customMessage || 'Please take a moment to share your feedback about the event.',
      deliveryStatus: 'sent'
    });

    await surveyMessage.save();

    // Create MessageRead entries for tracking
    const MessageRead = (await import('../models/MessageRead.js')).default;
    const readEntries = attendees.map(a => ({
      message: surveyMessage._id,
      attendee: a._id
    }));

    try {
      await MessageRead.insertMany(readEntries, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) {
        console.error('Failed to insert MessageRead entries', err);
      }
    }

    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        await sendSurveyEmail(attendee, event, { surveyUrl, customMessage });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send survey to ${attendee.email}:`, error);
      }
    }

    res.json({
      message: `Survey sent to ${sentCount}/${attendees.length} attendees`,
      totalRecipients: attendees.length,
      successfulDeliveries: sentCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get messages for an event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Exclude per-attendee copies of broadcast messages to avoid duplicate entries in admin view
    // Keep messages that are either:
    //  - broadcasts without a specific recipient (public announcement)
    //  - or any message that is not a broadcast (individual, survey, etc.) even if recipient exists
    const messages = await Message.find({
      event: eventId,
      $nor: [ { recipient: { $exists: true }, type: 'broadcast' } ]
    })
      .populate('recipient', 'name email registrationId')
      .populate('sender', 'name')
      .sort({ sentAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get public messages for an event (broadcast announcements)
router.get('/public/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get broadcast messages for the event (only type 'broadcast' and public announcements)
    const messages = await Message.find({ 
      event: eventId, 
      type: 'broadcast',
      recipient: { $exists: false } // Only get messages without specific recipients (public announcements)
    })
      .populate('sender', 'name')
      .sort({ sentAt: -1 })
      .limit(10); // Limit to latest 10 messages

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark survey as completed (public endpoint)
router.post('/survey-completed/:attendeeId', async (req, res) => {
  try {
    const { attendeeId } = req.params;

    await Attendee.findByIdAndUpdate(attendeeId, {
      surveyCompleted: true
    });

    res.json({ message: 'Survey completion recorded' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create public announcement for event
router.post('/announcement', authenticateToken, async (req, res) => {
  try {
    const { eventId, subject, content } = req.body;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create public announcement message (no specific recipient)
    const publicMessage = new Message({
      event: eventId,
      sender: req.user.id,
      type: 'broadcast',
      subject,
      content,
      deliveryStatus: 'sent'
    });

    await publicMessage.save();
    await publicMessage.populate('sender', 'name');

    // Create MessageRead entries for attendees so we can track per-user delivery/read without duplicating messages
    const attendees = await Attendee.find({ event: eventId }).select('_id');
    if (attendees && attendees.length > 0) {
      const MessageRead = (await import('../models/MessageRead.js')).default;

      const readEntries = attendees.map(a => ({
        message: publicMessage._id,
        attendee: a._id
      }));

      // Insert many; ignore duplicate key errors
      try {
        await MessageRead.insertMany(readEntries, { ordered: false });
      } catch (err) {
        // ignore duplicate key errors
        if (err.code !== 11000) {
          console.error('Failed to insert MessageRead entries', err);
        }
      }

      // Emit socket event to clients in the event room
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`event_${eventId}`).emit('new-announcement', {
            announcements: [{
              _id: publicMessage._id,
              subject: publicMessage.subject,
              content: publicMessage.content,
              sentAt: publicMessage.sentAt,
              event: { _id: eventId, title: event.title },
              sender: { name: req.user.name || 'Organizer' }
            }]
          });
        }
      } catch (err) {
        console.error('Socket emit failed', err);
      }
    }

    res.json({
      message: 'Announcement created successfully',
      announcement: publicMessage
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get unread messages for a user (public announcements from events they're registered for or recipient-specific messages)
router.get('/user/unread', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // First, find all attendee records for this user to get event IDs and attendee IDs
    const userAttendees = await Attendee.find({ user: userId }).select('_id event');
    if (!userAttendees || userAttendees.length === 0) {
      return res.json([]);
    }

    const eventIds = userAttendees.map(reg => reg.event);
    const attendeeIds = userAttendees.map(reg => reg._id);

    const MessageRead = (await import('../models/MessageRead.js')).default;

    // Find messages that have MessageRead entries for user's attendees but aren't marked as seen
    const readMessageIds = (await MessageRead.find({ attendee: { $in: attendeeIds } })).map(r => r.message);

    // Find all public messages (broadcast, survey, announcement) for the user's events that have MessageRead entries => these are targeted at user
    const unreadMessages = await Message.find({
      _id: { $in: readMessageIds },
      event: { $in: eventIds },
      recipient: { $exists: false }
    })
      .populate('event', 'title')
      .populate('sender', 'name')
      .sort({ sentAt: -1 })
      .limit(50);

    // Also get any messages explicitly targeted to the user's attendee records (legacy data)
    const targetedMessages = await Message.find({ 
      recipient: { $in: attendeeIds },
      isRead: { $ne: true }
    })
      .populate('sender', 'name')
      .populate('event', 'title')
      .sort({ sentAt: -1 })
      .limit(50);

    // Merge and dedupe by message ID
    const messageMap = new Map();
    [...unreadMessages, ...targetedMessages].forEach(msg => {
      messageMap.set(msg._id.toString(), msg);
    });

    const combined = Array.from(messageMap.values()).sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );

    res.json(combined.slice(0, 50));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark messages as seen for a user
router.post('/user/mark-seen', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'messageIds must be a non-empty array' });
    }

    const userId = req.user.id;

    // Find the attendee records for this user
    const userAttendees = await Attendee.find({ user: userId }).select('_id');
    const attendeeIds = userAttendees.map(a => a._id);

    if (!attendeeIds.length) {
      return res.status(200).json({ message: 'No attendee records found for user', created: 0 });
    }

    const MessageRead = (await import('../models/MessageRead.js')).default;

    const entries = [];
    for (const messageId of messageIds) {
      for (const attendeeId of attendeeIds) {
        entries.push({ message: messageId, attendee: attendeeId });
      }
    }

    let created = 0;
    try {
      const insertResult = await MessageRead.insertMany(entries, { ordered: false });
      created = insertResult.length || 0;
    } catch (err) {
      // Handle duplicate key errors - count inserted
      if (err && Array.isArray(err.insertedDocs)) {
        created = err.insertedDocs.length;
      }
    }

    res.json({ message: 'Messages marked as seen', created });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;