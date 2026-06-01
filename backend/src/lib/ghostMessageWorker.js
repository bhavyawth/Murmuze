import Message from '../models/message.model.js';
import { getRecieverSocketId, io } from './socket.js';

// Runs every 10 seconds — deletes expired ghost messages
export function startGhostMessageWorker() {
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredMessages = await Message.find({
        expiresAt: { $lte: now },
        expiresAt: { $ne: null }
      });

      if (expiredMessages.length === 0) return;

      for (const msg of expiredMessages) {
        // Notify both sender and receiver to remove message from UI
        const senderSocketId = getRecieverSocketId(msg.senderId.toString());
        const receiverSocketId = getRecieverSocketId(msg.recieverId.toString());

        if (senderSocketId) {
          io.to(senderSocketId).emit('messageExpired', { messageId: msg._id });
        }
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('messageExpired', { messageId: msg._id });
        }

        // Delete from database
        await Message.findByIdAndDelete(msg._id);
      }

      console.log(`👻 Deleted ${expiredMessages.length} expired ghost messages`);
    } catch (err) {
      console.error('Ghost message worker error:', err);
    }
  }, 30_000); // every 10 seconds
}
