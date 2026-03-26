import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server } from './lib/socket.js'; 

import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';

dotenv.config();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server is running on port: ${process.env.PORT || 3000}`);
  connectDB();
})
