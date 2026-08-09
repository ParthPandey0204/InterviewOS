import { Router } from "express";
import * as sessionController from "../controllers/session.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.post("/", sessionController.createSession);
sessionRouter.get("/", sessionController.listUserSessions);
sessionRouter.get("/analytics", sessionController.getAnalytics);
sessionRouter.post("/:id/turns", sessionController.createTurn);
sessionRouter.post("/:id/start/stream", sessionController.startSessionStream);
sessionRouter.post("/:id/turns/stream", sessionController.createTurnStream);
sessionRouter.post("/:id/complete", sessionController.completeSession);
sessionRouter.get("/:id", sessionController.getSessionById);
