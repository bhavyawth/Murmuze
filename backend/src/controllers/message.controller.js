import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId, io } from "../lib/socket.js";

const XP_PER_LEVEL = 100;
const ACHIEVEMENTS = {
  FIRST_MESSAGE: "first_message", HUNDRED_MESSAGES: "hundred_messages",
  NIGHT_OWL: "night_owl", CHATTERBOX: "chatterbox",
  STREAK_7: "streak_7", STREAK_30: "streak_30",
  IMAGE_SENDER: "image_sender", VOICE_SENDER: "voice_sender", POLL_CREATOR: "poll_creator",
};

async function awardXP(user, amount) {
  user.xp += amount;
  user.level = Math.floor(user.xp / XP_PER_LEVEL) + 1;
}

async function checkAndAwardAchievements(user, message) {
  const newAchievements = [];
  const hour = new Date().getHours();
  const checks = [
    [user.totalMessages === 1, ACHIEVEMENTS.FIRST_MESSAGE],
    [user.totalMessages >= 100, ACHIEVEMENTS.HUNDRED_MESSAGES],
    [(hour >= 0 && hour < 5), ACHIEVEMENTS.NIGHT_OWL],
    [!!message.image, ACHIEVEMENTS.IMAGE_SENDER],
    [!!message.audio, ACHIEVEMENTS.VOICE_SENDER],
    [!!message.poll?.question, ACHIEVEMENTS.POLL_CREATOR],
  ];
  for (const [cond, key] of checks) {
    if (cond && !user.achievements.includes(key)) {
      newAchievements.push(key);
      user.achievements.push(key);
    }
  }
  return newAchievements;
}

function updateStreak(user) {
  const today = new Date().toISOString().split("T")[0];
  if (user.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  user.streak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
  user.lastActiveDate = today;
  if (user.streak >= 7 && !user.achievements.includes(ACHIEVEMENTS.STREAK_7))
    user.achievements.push(ACHIEVEMENTS.STREAK_7);
  if (user.streak >= 30 && !user.achievements.includes(ACHIEVEMENTS.STREAK_30))
    user.achievements.push(ACHIEVEMENTS.STREAK_30);
}

function updateActivityLog(user) {
  const today = new Date().toISOString().split("T")[0];
  const current = user.activityLog.get(today) || 0;
  user.activityLog.set(today, current + 1);
  user.markModified('activityLog');
}

// Only return friends as chat contacts
export const getUsersHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const me = await User.findById(myId).populate("friends", "-password");
    return res.status(200).json(me.friends);
  } catch (error) {
    console.error("getUsersHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessagesHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: userToChatId },
        { senderId: userToChatId, recieverId: myId },
      ],
      isDelivered: true,
    }).populate("senderId", "profilePic").populate("replyTo", "text image audio gif senderId messageType").sort({ createdAt: 1 });
    await Message.updateMany(
      { senderId: userToChatId, recieverId: myId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return res.status(200).json(messages);
  } catch (error) {
    console.error("getMessagesHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessageHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { text, image, audio, gif, replyTo, poll, scheduledFor, disappearAfter } = req.body;
    const myId = req.user._id;

    let imageUrl, audioUrl;
    if (image) {
      const r = await cloudinary.uploader.upload(image, { resource_type: "image" });
      imageUrl = r.secure_url;
    }
    if (audio) {
      const r = await cloudinary.uploader.upload(audio, { resource_type: "video", format: "webm" });
      audioUrl = r.secure_url;
    }

    let messageType = "text";
    if (imageUrl) messageType = "image";
    else if (audioUrl) messageType = "audio";
    else if (gif) messageType = "gif";
    else if (poll?.question) messageType = "poll";
    else if (scheduledFor) messageType = "capsule";

    const expiresAt = disappearAfter ? new Date(Date.now() + disappearAfter * 1000) : null;
    const isDelivered = scheduledFor ? false : true;

    const newMessage = new Message({
      senderId: myId, recieverId: userToChatId,
      text: text || null, image: imageUrl || null, audio: audioUrl || null, gif: gif || null,
      replyTo: replyTo || null, messageType, expiresAt,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null, isDelivered,
      poll: poll?.question ? { question: poll.question, options: poll.options.map(o => ({ text: o, votes: [] })) } : undefined,
    });
    await newMessage.save();

    const sender = await User.findById(myId);
    sender.totalMessages += 1;
    updateStreak(sender);
    updateActivityLog(sender);
    await awardXP(sender, 5);
    const newAchievements = await checkAndAwardAchievements(sender, newMessage);
    await sender.save();

    const messageData = await newMessage.populate([
      {
        path: "senderId",
        select: "profilePic",
      },
      {
        path: "replyTo",
        select: "text image audio gif senderId messageType",
      },
    ]);
    if (isDelivered) {
      const receiverSocketId = getRecieverSocketId(userToChatId);
      if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", messageData);
    }

    if (newAchievements.length > 0) {
      const senderSocket = getRecieverSocketId(myId.toString());
      if (senderSocket) io.to(senderSocket).emit("achievementUnlocked", { achievements: newAchievements, xp: sender.xp, level: sender.level });
    }

    return res.status(201).json({ ...messageData.toObject(), senderXP: sender.xp, senderLevel: sender.level });
  } catch (error) {
    console.error("sendMessageHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessageHandler = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== myId.toString())
      return res.status(403).json({ message: "Not authorized" });
    message.isDeleted = true;
    message.text = message.image = message.audio = message.gif = null;
    await message.save();
    const receiverSocket = getRecieverSocketId(message.recieverId.toString());
    if (receiverSocket) io.to(receiverSocket).emit("messageDeleted", { messageId });
    return res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("deleteMessageHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reactToMessageHandler = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const myId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    const idx = message.reactions.findIndex(r => r.userId.toString() === myId.toString());
    if (idx !== -1) {
      if (message.reactions[idx].emoji === emoji) message.reactions.splice(idx, 1);
      else message.reactions[idx].emoji = emoji;
    } else {
      message.reactions.push({ userId: myId, emoji });
    }
    await message.save();
    const otherUserId = message.senderId.toString() === myId.toString() ? message.recieverId : message.senderId;
    [otherUserId, myId].forEach(uid => {
      const s = getRecieverSocketId(uid.toString());
      if (s) io.to(s).emit("reactionUpdate", { messageId, reactions: message.reactions });
    });
    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("reactToMessageHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const voteOnPollHandler = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { optionIndex } = req.body;
    const myId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message || message.messageType !== "poll")
      return res.status(404).json({ message: "Poll not found" });
    message.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== myId.toString());
    });
    message.poll.options[optionIndex].votes.push(myId);
    await message.save();
    const otherUserId = message.senderId.toString() === myId.toString() ? message.recieverId : message.senderId;
    [otherUserId, myId].forEach(uid => {
      const s = getRecieverSocketId(uid.toString());
      if (s) io.to(s).emit("pollUpdate", { messageId, poll: message.poll });
    });
    return res.status(200).json({ poll: message.poll });
  } catch (error) {
    console.error("voteOnPollHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchMessagesHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { q } = req.query;
    const myId = req.user._id;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: "Query too short" });
    const messages = await Message.find({
      $or: [{ senderId: myId, recieverId: userToChatId }, { senderId: userToChatId, recieverId: myId }],
      text: { $regex: q.trim(), $options: "i" }, isDeleted: false, isDelivered: true,
    }).sort({ createdAt: -1 }).limit(30);
    return res.status(200).json(messages);
  } catch (error) {
    console.error("searchMessagesHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCallLogsHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const logs = await CallLog.find({ $or: [{ callerId: myId }, { receiverId: myId }] })
      .populate("callerId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(logs);
  } catch (error) {
    console.error("getCallLogsHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatStatsHandler = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: myId, recieverId: userToChatId }, { senderId: userToChatId, recieverId: myId }],
      isDeleted: false,
    });
    const totalMessages = messages.length;
    const myMessages = messages.filter(m => m.senderId.toString() === myId.toString()).length;
    const wordCount = {};
    messages.forEach(m => {
      if (m.text) m.text.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 3) wordCount[w] = (wordCount[w] || 0) + 1;
      });
    });
    const topWords = Object.entries(wordCount).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({word,count}));
    const hourly = Array(24).fill(0);
    messages.forEach(m => { hourly[new Date(m.createdAt).getHours()]++; });
    return res.status(200).json({
      totalMessages, myMessages, theirMessages: totalMessages - myMessages,
      topWords, hourly,
      imagesCount: messages.filter(m => m.image).length,
      audioCount: messages.filter(m => m.audio).length,
      firstMessage: messages[0]?.createdAt || null,
    });
  } catch (error) {
    console.error("getChatStatsHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
