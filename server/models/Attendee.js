import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  dietaryRequirements: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String
  },
  registrationId: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String // Base64 encoded QR code
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  checkInStatus: {
    type: String,
    enum: ['not_checked_in', 'checked_in', 'checked_out'],
    default: 'not_checked_in'
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  attendanceType: {
    type: String,
    enum: ['physical', 'virtual', 'hybrid'],
    default: 'physical'
  },
  surveyCompleted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for unique email per event
attendeeSchema.index({ event: 1, email: 1 }, { unique: true });
attendeeSchema.index({ registrationId: 1 });
attendeeSchema.index({ event: 1, checkInStatus: 1 });

export default mongoose.model('Attendee', attendeeSchema);