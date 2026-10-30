import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { credentialRateLimit, refreshRateLimit } from "../middleware/rate-limit.js";

export const authRouter = Router();

authRouter.post("/register", credentialRateLimit, authController.register);
authRouter.post("/login", credentialRateLimit, authController.login);
authRouter.post("/refresh", refreshRateLimit, authController.refresh);
authRouter.post("/logout", refreshRateLimit, authController.logout);
authRouter.get("/me", requireAuth, authController.me);
