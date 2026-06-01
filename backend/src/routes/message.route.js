import { Router } from "express";
import {
  getUsersHandler,
  getMessagesHandler,
  sendMessageHandler,
  deleteMessageHandler,
  reactToMessageHandler,
  voteOnPollHandler,
  searchMessagesHandler,
  getCallLogsHandler,
  getChatStatsHandler,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

// ── IMPORTANT: specific routes MUST come before /:id wildcard ──
router.get("/users", protectRoute, getUsersHandler);
router.get("/calls", protectRoute, getCallLogsHandler);
router.get("/search/:id", protectRoute, searchMessagesHandler);
router.get("/stats/:id", protectRoute, getChatStatsHandler);

// Wildcard last — otherwise /users, /calls etc get swallowed by /:id
router.get("/:id", protectRoute, getMessagesHandler);

router.post("/send/:id", protectRoute, sendMessageHandler);
router.post("/react/:id", protectRoute, reactToMessageHandler);
router.post("/poll/:id/vote", protectRoute, voteOnPollHandler);

router.delete("/:id", protectRoute, deleteMessageHandler);

export default router;
