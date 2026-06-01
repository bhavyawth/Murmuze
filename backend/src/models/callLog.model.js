import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["video", "audio"], required: true },
    status: { type: String, enum: ["missed", "answered", "rejected", "ended"], required: true },
    duration: { type: Number, default: 0 }, // seconds
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);
export default CallLog;
