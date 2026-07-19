import { Router } from "express";
import * as sessionController from "../controllers/session.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.post("/", sessionController.createSession);
sessionRouter.get("/", sessionController.listUserSessions);
sessionRouter.get("/:id", sessionController.getSessionById);