import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: null },
    image: { type: String, default: null },
    audio: { type: String, default: null },
    gif: { type: String, default: null },
    // Reply threading
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Reactions: array of { userId, emoji }
    reactions: [reactionSchema],
    // Read receipt
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // Deletion
    isDeleted: { type: Boolean, default: false },
    // Disappearing messages
    expiresAt: { type: Date, default: null },
    // Polls
    poll: {
      question: { type: String, default: null },
      options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }],
    },
    // Time capsule
    scheduledFor: { type: Date, default: null },
    isDelivered: { type: Boolean, default: true },
    // Message type
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "gif", "poll", "capsule", "system"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-index for fast conversation queries
messageSchema.index({ senderId: 1, recieverId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
