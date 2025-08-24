import mongoose from 'mongoose';

const messageReadSchema = new mongoose.Schema({
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true },
  seenAt: { type: Date, default: Date.now }
}, { timestamps: true });

messageReadSchema.index({ message: 1, attendee: 1 }, { unique: true });

export default mongoose.model('MessageRead', messageReadSchema);
