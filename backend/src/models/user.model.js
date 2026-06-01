import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: {
      type: String,
      default: "https://res.cloudinary.com/duchoypmw/image/upload/v1777375803/icon_rf1xau.jpg"
    },
    bio: { type: String, default: "", maxlength: 150 },

    // Gamification
    xp:             { type: Number, default: 0 },
    level:          { type: Number, default: 1 },
    streak:         { type: Number, default: 0 },
    lastActiveDate: { type: String, default: "" },
    achievements:   [{ type: String }],
    totalMessages:  { type: Number, default: 0 },

    // Activity heatmap: { "2025-06-01": 12, "2025-06-02": 5, ... }
    activityLog: { type: Map, of: Number, default: {} },

    // Friends system
    // friends: accepted friend IDs
    friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // sentRequests: IDs we've sent a request to
    sentRequests:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // pendingRequests: IDs who sent us a request
    pendingRequests:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Settings
    readReceiptsEnabled:    { type: Boolean, default: true },
    notificationsEnabled:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
