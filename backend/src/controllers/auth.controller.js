import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import { getRecieverSocketId, io } from '../lib/socket.js';

const XP_PER_LEVEL = 100;

export const signupHandler = async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, fullName, password: hashedPassword });
    generateToken(newUser._id, res);
    await newUser.save();
    return res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("signupHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist" });
    if (!await bcrypt.compare(password, user.password))
      return res.status(400).json({ message: "Invalid credentials" });
    generateToken(user._id, res);
    return res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("loginHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutHandler = async (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("logoutHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfileHandler = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;
    const updateData = {};
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }
    if (fullName) updateData.fullName = fullName.trim();
    if (bio !== undefined) updateData.bio = bio.slice(0, 150);
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("updateProfileHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuthHandler = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    console.error("checkAuthHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLeaderboardHandler = async (req, res) => {
  try {
    const users = await User.find({})
      .select("fullName profilePic xp level streak totalMessages")
      .sort({ xp: -1 }).limit(20);
    return res.status(200).json(users);
  } catch (error) {
    console.error("getLeaderboardHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Friend Requests ────────────────────────────────────────────

export const sendFriendRequestHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const { targetId } = req.params;
    if (myId.toString() === targetId)
      return res.status(400).json({ message: "Cannot add yourself" });

    const [me, target] = await Promise.all([User.findById(myId), User.findById(targetId)]);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (me.friends.includes(targetId))
      return res.status(400).json({ message: "Already friends" });
    if (me.sentRequests.includes(targetId))
      return res.status(400).json({ message: "Request already sent" });

    // If target already sent us a request → auto-accept
    if (me.pendingRequests.includes(targetId)) {
      me.friends.push(targetId);
      me.pendingRequests = me.pendingRequests.filter(id => id.toString() !== targetId);
      target.friends.push(myId);
      target.sentRequests = target.sentRequests.filter(id => id.toString() !== myId.toString());
      await Promise.all([me.save(), target.save()]);
      // Notify both via socket
      const targetSocket = getRecieverSocketId(targetId);
      if (targetSocket) io.to(targetSocket).emit("friendRequestAccepted", { by: myId, byName: me.fullName });
      const mySocket = getRecieverSocketId(myId.toString());
      if (mySocket) io.to(mySocket).emit("friendRequestAccepted", { by: targetId, byName: target.fullName });
      return res.status(200).json({ message: "Now friends!", status: "accepted" });
    }

    me.sentRequests.push(targetId);
    target.pendingRequests.push(myId);
    await Promise.all([me.save(), target.save()]);

    // Notify target
    const targetSocket = getRecieverSocketId(targetId);
    if (targetSocket) io.to(targetSocket).emit("newFriendRequest", { from: myId, fromName: me.fullName, fromPic: me.profilePic });

    return res.status(200).json({ message: "Friend request sent", status: "pending" });
  } catch (error) {
    console.error("sendFriendRequestHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequestHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requesterId } = req.params;
    const [me, requester] = await Promise.all([User.findById(myId), User.findById(requesterId)]);
    if (!me.pendingRequests.includes(requesterId))
      return res.status(400).json({ message: "No pending request from this user" });

    me.friends.push(requesterId);
    me.pendingRequests = me.pendingRequests.filter(id => id.toString() !== requesterId);
    requester.friends.push(myId);
    requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== myId.toString());
    await Promise.all([me.save(), requester.save()]);

    // Notify the requester
    const requesterSocket = getRecieverSocketId(requesterId);
    if (requesterSocket) io.to(requesterSocket).emit("friendRequestAccepted", { by: myId, byName: me.fullName });

    // Notify the acceptor (so their sidebar refreshes too)
    const mySocket = getRecieverSocketId(myId.toString());
    if (mySocket) io.to(mySocket).emit("friendRequestAccepted", { by: requesterId, byName: requester.fullName });

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("acceptFriendRequestHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const declineFriendRequestHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requesterId } = req.params;
    const [me, requester] = await Promise.all([User.findById(myId), User.findById(requesterId)]);
    me.pendingRequests = me.pendingRequests.filter(id => id.toString() !== requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== myId.toString());
    await Promise.all([me.save(), requester.save()]);
    return res.status(200).json({ message: "Request declined" });
  } catch (error) {
    console.error("declineFriendRequestHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriendsDataHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const me = await User.findById(myId)
      .populate("friends", "fullName profilePic xp level streak bio")
      .populate("pendingRequests", "fullName profilePic xp level")
      .populate("sentRequests", "fullName profilePic");
    return res.status(200).json({
      friends: me.friends,
      pendingRequests: me.pendingRequests,
      sentRequests: me.sentRequests,
    });
  } catch (error) {
    console.error("getFriendsDataHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsersHandler = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: "Query too short" });
    const users = await User.find({
      _id: { $ne: myId },
      fullName: { $regex: q.trim(), $options: "i" },
    }).select("fullName profilePic xp level bio").limit(20);
    // attach relationship status
    const me = await User.findById(myId);
    const result = users.map(u => ({
      ...u.toObject(),
      isFriend: me.friends.map(f => f.toString()).includes(u._id.toString()),
      requestSent: me.sentRequests.map(s => s.toString()).includes(u._id.toString()),
      requestPending: me.pendingRequests.map(p => p.toString()).includes(u._id.toString()),
    }));
    return res.status(200).json(result);
  } catch (error) {
    console.error("searchUsersHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getActivityLogHandler = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId).select("activityLog fullName");
    if (!user) return res.status(404).json({ message: "User not found" });
    // Convert Map to plain object
    const log = {};
    user.activityLog.forEach((val, key) => { log[key] = val; });
    return res.status(200).json({ activityLog: log });
  } catch (error) {
    console.error("getActivityLogHandler:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
