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

export default router;