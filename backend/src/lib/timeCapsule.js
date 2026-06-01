import Message from '../models/message.model.js';
import { getRecieverSocketId, io } from './socket.js';

// Runs every minute — delivers scheduled time capsule messages
export function startTimeCapsuleWorker() {
  setInterval(async () => {
    try {
      const now = new Date();
      const pendingMessages = await Message.find({
        isDelivered: false,
        scheduledFor: { $lte: now },
        messageType: 'capsule',
      }).populate('replyTo', 'text image senderId');

      for (const msg of pendingMessages) {
        msg.isDelivered = true;
        await msg.save();
        // Notify the receiver
        const receiverSocketId = getRecieverSocketId(msg.recieverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', msg);
        }
      }
      if (pendingMessages.length > 0) {
        console.log(`⏳ Delivered ${pendingMessages.length} time capsule messages`);
      }
    } catch (err) {
      console.error('Time capsule worker error:', err);
    }
  }, 60_000); // every 60 seconds
}
