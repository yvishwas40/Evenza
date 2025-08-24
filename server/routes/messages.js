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

    // Create message records
    const messages = attendees.map(attendee => ({
      event: eventId,
      sender: req.user.id,
      recipient: attendee._id,
      type: 'broadcast',
      subject,
      content,
      deliveryStatus: 'pending'
    }));

    await Message.insertMany(messages);

    // Send emails
    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        await sendBroadcastEmail(attendee, event, { subject, content });
        await Message.findOneAndUpdate(
          { recipient: attendee._id, subject, deliveryStatus: 'pending' },
          { deliveryStatus: 'sent' }
        );
        sentCount++;
      } catch (error) {
        await Message.findOneAndUpdate(
          { recipient: attendee._id, subject, deliveryStatus: 'pending' },
          { deliveryStatus: 'failed' }
        );
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

    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        await sendSurveyEmail(attendee, event, { surveyUrl, customMessage });
        
        // Create message record
        await new Message({
          event: eventId,
          sender: req.user.id,
          recipient: attendee._id,
          type: 'survey',
          subject: `Survey: ${event.title}`,
          content: customMessage || 'Please take a moment to share your feedback about the event.',
          deliveryStatus: 'sent'
        }).save();

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

    const messages = await Message.find({ event: eventId })
      .populate('recipient', 'name email registrationId')
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

    // Also create per-attendee message records so each attendee has a recipient-linked message
    const attendees = await Attendee.find({ event: eventId }).select('_id');
    if (attendees && attendees.length > 0) {
      const perAttendeeMessages = attendees.map(a => ({
        event: eventId,
        sender: req.user.id,
        recipient: a._id,
        type: 'broadcast',
        subject,
        content,
        deliveryStatus: 'sent'
      }));

      // Insert per-attendee messages in bulk
      const inserted = await Message.insertMany(perAttendeeMessages);

      // Emit socket event to clients in the event room
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`event_${eventId}`).emit('new-announcement', {
            announcements: inserted.map(m => ({
              _id: m._id,
              subject: m.subject,
              content: m.content,
              sentAt: m.sentAt,
              event: { _id: eventId, title: event.title },
              sender: { name: req.user.name || 'Organizer' }
            }))
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

    // Get messages either targeted to this attendee (recipient in attendeeIds) OR public announcements for their events
    const messages = await Message.find({
      $or: [
        { recipient: { $in: attendeeIds } },
        { event: { $in: eventIds }, recipient: { $exists: false } }
      ]
    })
      .populate('event', 'title')
      .populate('sender', 'name')
      .sort({ sentAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark messages as seen for a user
router.post('/user/mark-seen', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;

    // This endpoint is a placeholder. A full implementation would record per-user read status.
    // For now, return success so frontend can mark locally.
    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;