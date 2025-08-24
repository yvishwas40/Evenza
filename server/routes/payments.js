import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment.js';
import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { simulatePaymentProcessing } from '../utils/payment.js';

const router = express.Router();

// Create payment intent (fake payment)
router.post('/create-intent', async (req, res) => {
  try {
    const { attendeeId, eventId } = req.body;

    const attendee = await Attendee.findById(attendeeId);
    const event = await Event.findById(eventId);

    if (!attendee || !event) {
      return res.status(404).json({ message: 'Attendee or event not found' });
    }

    if (!event.isPaid) {
      return res.status(400).json({ message: 'This event is free' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ attendee: attendeeId, event: eventId });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const transactionId = `TXN-${uuidv4()}`;
    const paymentIntentId = `PI-${uuidv4()}`;

    // Create or update payment record
    let payment = await Payment.findOneAndUpdate(
      { attendee: attendeeId, event: eventId },
      {
        amount: event.ticketPrice,
        currency: 'USD',
        paymentMethod: 'stripe',
        transactionId,
        paymentIntentId,
        status: 'pending',
        metadata: {
          eventTitle: event.title,
          attendeeName: attendee.name,
          attendeeEmail: attendee.email
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      paymentIntentId,
      amount: event.ticketPrice,
      currency: 'USD',
      clientSecret: `${paymentIntentId}_secret_${Date.now()}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Process payment (fake processing)
router.post('/process', async (req, res) => {
  try {
    const { paymentIntentId, attendeeId } = req.body;

    const payment = await Payment.findOne({ paymentIntentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Simulate payment processing
    const result = await simulatePaymentProcessing(payment);
    
    if (result.success) {
      payment.status = 'completed';
      payment.receiptUrl = result.receiptUrl;
      await payment.save();

      // Update attendee payment status
      await Attendee.findByIdAndUpdate(attendeeId, {
        paymentStatus: 'completed',
        paymentId: payment.transactionId
      });

      res.json({
        success: true,
        message: 'Payment successful',
        receiptUrl: result.receiptUrl,
        transactionId: payment.transactionId
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      await Attendee.findByIdAndUpdate(attendeeId, {
        paymentStatus: 'failed'
      });

      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get payment status
router.get('/status/:attendeeId/:eventId', async (req, res) => {
  try {
    const { attendeeId, eventId } = req.params;

    const payment = await Payment.findOne({ attendee: attendeeId, event: eventId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      receiptUrl: payment.receiptUrl,
      createdAt: payment.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get payments for an event (admin)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const payments = await Payment.find({ event: eventId })
      .populate('attendee', 'name email phone registrationId')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Refund payment (admin)
router.post('/refund/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('event', 'organizer');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if organizer owns this event
    if (payment.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot refund uncompleted payment' });
    }

    const refundAmount = amount || payment.amount;
    const refundId = `REF-${uuidv4()}`;

    payment.status = 'refunded';
    payment.refundId = refundId;
    payment.refundAmount = refundAmount;
    payment.metadata = {
      ...payment.metadata,
      refundReason: reason,
      refundDate: new Date()
    };

    await payment.save();

    // Update attendee payment status
    await Attendee.findByIdAndUpdate(payment.attendee, {
      paymentStatus: 'refunded'
    });

    res.json({
      message: 'Refund processed successfully',
      refundId,
      refundAmount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;