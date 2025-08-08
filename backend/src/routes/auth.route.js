import { Router } from "express";
import {  
  signupHandler, 
  loginHandler, 
  logoutHandler, 
  updateProfileHandler, 
  checkAuthHandler
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupHandler);
router.post("/login", loginHandler);
router.post("/logout",protectRoute, logoutHandler);

router.put("/profile", protectRoute, updateProfileHandler);

router.get("/check", protectRoute, checkAuthHandler);

export default router;