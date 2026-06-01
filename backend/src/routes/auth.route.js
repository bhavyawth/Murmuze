import { Router } from "express";
import {
  signupHandler, loginHandler, logoutHandler,
  updateProfileHandler, checkAuthHandler, getLeaderboardHandler,
  sendFriendRequestHandler, acceptFriendRequestHandler,
  declineFriendRequestHandler, getFriendsDataHandler,
  searchUsersHandler, getActivityLogHandler,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup",  signupHandler);
router.post("/login",   loginHandler);
router.post("/logout",  protectRoute, logoutHandler);
router.put("/profile",  protectRoute, updateProfileHandler);
router.get("/check",    protectRoute, checkAuthHandler);
router.get("/leaderboard", protectRoute, getLeaderboardHandler);

// Friends
router.get("/friends",                     protectRoute, getFriendsDataHandler);
router.get("/search",                      protectRoute, searchUsersHandler);
router.post("/friends/request/:targetId",  protectRoute, sendFriendRequestHandler);
router.post("/friends/accept/:requesterId",protectRoute, acceptFriendRequestHandler);
router.post("/friends/decline/:requesterId",protectRoute, declineFriendRequestHandler);

// Activity heatmap
router.get("/activity/:userId", protectRoute, getActivityLogHandler);
router.get("/activity",         protectRoute, getActivityLogHandler);

export default router;
