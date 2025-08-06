import { Router } from "express";
import {
  getUsersHandler,
  getMessagesHandler,
  sendMessageHandler,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users", protectRoute, getUsersHandler);
router.get("/:id", protectRoute, getMessagesHandler);

router.post("/send/:id", protectRoute, sendMessageHandler);

export default router;