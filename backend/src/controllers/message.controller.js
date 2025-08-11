import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId, io } from "../lib/socket.js";

export const getUsersHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");
    return res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });    
  }
};

export const getMessagesHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: userToChatId },
        { senderId: userToChatId, recieverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessagesHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const sendMessageHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { text, image } = req.body;
    const myId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId: myId,
      recieverId: userToChatId,
      text: text,
      image: imageUrl
    });
    await newMessage.save();
    const messageData = newMessage.toObject();

    const recieverSocketId = getRecieverSocketId(userToChatId);
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", messageData);
    }

    return res.status(201).json({...messageData});
  } catch (error) {
    console.error("Error in sendMessageHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};