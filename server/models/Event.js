import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  poster: {
    type: String // URL to poster image
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  zoomLink: {
    type: String
  },
  meetingId: {
    type: String
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  ticketPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String
  }],
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  registrationDeadline: {
    type: Date
  },
  attendeeCount: {
    type: Number,
    default: 0
  },
  checkInCount: {
    type: Number,
    default: 0
  },
  gsheetId: {
    type: String // Google Sheets ID for tracking
  },
  appScriptUrl: {
    type: String // Apps Script Web App URL
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Event', eventSchema);