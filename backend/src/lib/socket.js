import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import CallLog from '../models/callLog.model.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// userId -> socketId
const userSocketMap = {};

function getRecieverSocketId(userId) {
  return userSocketMap[userId.toString()];
}

// Active calls: callId -> { callerId, receiverId, type, startedAt }
const activeCalls = {};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ── Typing indicators ──────────────────────────────────────
  socket.on("typing", ({ to }) => {
    const receiverSocketId = getRecieverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { from: userId });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = getRecieverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { from: userId });
    }
  });

  // ── Read receipts ──────────────────────────────────────────
  socket.on("markRead", ({ from }) => {
    const senderSocketId = getRecieverSocketId(from);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { by: userId });
    }
  });

  // ── Message reactions ──────────────────────────────────────
  socket.on("messageReaction", ({ messageId, emoji, to }) => {
    const receiverSocketId = getRecieverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionUpdate", { messageId, emoji, by: userId });
    }
  });

  // ── WebRTC Signaling ───────────────────────────────────────
  socket.on("callUser", ({ to, type, offer, callId }) => {
    const receiverSocketId = getRecieverSocketId(to);
    if (receiverSocketId) {
      activeCalls[callId] = { callerId: userId, receiverId: to, type, startedAt: null };
      io.to(receiverSocketId).emit("incomingCall", {
        from: userId,
        type,
        offer,
        callId,
      });
    } else {
      // User offline → missed call
      CallLog.create({
        callerId: userId,
        receiverId: to,
        type,
        status: "missed",
      }).catch(console.error);
      socket.emit("callFailed", { reason: "User is offline" });
    }
  });

  socket.on("answerCall", ({ to, answer, callId }) => {
    const callerSocketId = getRecieverSocketId(to);
    if (callerSocketId) {
      if (activeCalls[callId]) {
        activeCalls[callId].startedAt = new Date();
      }
      io.to(callerSocketId).emit("callAnswered", { answer, callId });
    }
  });

  socket.on("rejectCall", ({ to, callId }) => {
    const callerSocketId = getRecieverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected", { callId });
    }
    if (activeCalls[callId]) {
      CallLog.create({
        callerId: activeCalls[callId].callerId,
        receiverId: activeCalls[callId].receiverId,
        type: activeCalls[callId].type,
        status: "rejected",
      }).catch(console.error);
      delete activeCalls[callId];
    }
  });

  socket.on("endCall", ({ to, callId }) => {
    const otherSocketId = getRecieverSocketId(to);
    if (otherSocketId) {
      io.to(otherSocketId).emit("callEnded", { callId });
    }
    if (activeCalls[callId]) {
      const call = activeCalls[callId];
      const endedAt = new Date();
      const duration = call.startedAt
        ? Math.floor((endedAt - call.startedAt) / 1000)
        : 0;
      CallLog.create({
        callerId: call.callerId,
        receiverId: call.receiverId,
        type: call.type,
        status: "ended",
        duration,
        startedAt: call.startedAt,
        endedAt,
      }).catch(console.error);
      delete activeCalls[callId];
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const receiverSocketId = getRecieverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", { candidate, from: userId });
    }
  });

  // ── Disconnect ─────────────────────────────────────────────
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io, getRecieverSocketId };
