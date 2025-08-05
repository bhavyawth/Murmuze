import { Router } from "express";
import {  signupHandler, 
          loginHandler, 
          logoutHandler, 
          updateProfileHandler, 
          checkAuthHandler } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupHandler);
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);

router.put("/updateProfile", protectRoute, updateProfileHandler);

router.get("/check", protectRoute, checkAuthHandler);

export default router;