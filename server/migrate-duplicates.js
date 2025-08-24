// Migration script to clean up duplicate broadcast messages
// Run this once to remove duplicate per-attendee broadcast messages and create MessageRead entries

import mongoose from 'mongoose';
import Message from './models/Message.js';
import Attendee from './models/Attendee.js';
import MessageRead from './models/MessageRead.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventmanagement';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all broadcast messages that have recipients (these are duplicates)
    const duplicateBroadcasts = await Message.find({
      type: 'broadcast',
      recipient: { $exists: true }
    }).populate('recipient', '_id');

    console.log(`Found ${duplicateBroadcasts.length} duplicate broadcast messages`);

    // Group by event, subject, content to identify sets of duplicates
    const messageGroups = new Map();
    
    for (const msg of duplicateBroadcasts) {
      const key = `${msg.event}_${msg.subject}_${msg.content}`;
      if (!messageGroups.has(key)) {
        messageGroups.set(key, []);
      }
      messageGroups.get(key).push(msg);
    }

    console.log(`Found ${messageGroups.size} groups of duplicate messages`);

    let totalProcessed = 0;
    let totalReadEntriesCreated = 0;

    for (const [key, messages] of messageGroups) {
      // Check if there's already a public message for this group
      const [eventId, ...subjectContent] = key.split('_');
      const publicMessage = await Message.findOne({
        event: eventId,
        subject: messages[0].subject,
        content: messages[0].content,
        type: 'broadcast',
        recipient: { $exists: false }
      });

      let masterMessage = publicMessage;

      if (!publicMessage) {
        // Convert the first duplicate to a public message
        const firstMsg = messages[0];
        await Message.findByIdAndUpdate(firstMsg._id, {
          $unset: { recipient: 1 }
        });
        masterMessage = await Message.findById(firstMsg._id);
        console.log(`Converted message ${firstMsg._id} to public message`);
        
        // Remove it from the list of messages to delete
        messages.shift();
      }

      // Create MessageRead entries for all attendees that had duplicate messages
      const readEntries = [];
      for (const msg of messages) {
        if (msg.recipient && msg.recipient._id) {
          readEntries.push({
            message: masterMessage._id,
            attendee: msg.recipient._id
          });
        }
      }

      if (readEntries.length > 0) {
        try {
          await MessageRead.insertMany(readEntries, { ordered: false });
          totalReadEntriesCreated += readEntries.length;
          console.log(`Created ${readEntries.length} MessageRead entries for message ${masterMessage._id}`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`Some MessageRead entries already existed for message ${masterMessage._id}`);
          } else {
            console.error('Error creating MessageRead entries:', err);
          }
        }
      }

      // Delete the duplicate messages
      const messageIdsToDelete = messages.map(m => m._id);
      if (messageIdsToDelete.length > 0) {
        await Message.deleteMany({ _id: { $in: messageIdsToDelete } });
        console.log(`Deleted ${messageIdsToDelete.length} duplicate messages`);
        totalProcessed += messageIdsToDelete.length;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`- Processed ${totalProcessed} duplicate broadcast messages`);
    console.log(`- Created ${totalReadEntriesCreated} MessageRead entries`);
    console.log(`- Migration completed successfully`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;
