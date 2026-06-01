import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';
import { app, server } from './lib/socket.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import { startTimeCapsuleWorker } from './lib/timeCapsule.js';
import { startGhostMessageWorker } from './lib/ghostMessageWorker.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// CORS must come before routes
// In dev: CLIENT_URL = http://localhost:5173
// In prod: CLIENT_URL = https://your-app.vercel.app
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // required for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

connectDB().then(() => {
  startTimeCapsuleWorker();
  startGhostMessageWorker();
  server.listen(PORT, () => {
    console.log(`🚀 Murmuze server running on port ${PORT}`);
  });
});
