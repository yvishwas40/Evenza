import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendee',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  device: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  method: {
    type: String,
    enum: ['qr_scan', 'manual', 'mobile_app'],
    default: 'qr_scan'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

checkInSchema.index({ event: 1, checkInTime: -1 });
checkInSchema.index({ attendee: 1 });
checkInSchema.index({ location: '2dsphere' });

export default mongoose.model('CheckIn', checkInSchema);