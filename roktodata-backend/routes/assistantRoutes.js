import { Router } from "express";
import { assistantStatus, chat } from "../controllers/assistantController.js";
import { assistantLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { assistantChatSchema } from "../validators/schemas.js";

const router = Router();

router.get("/status", assistantStatus);
router.post("/chat", assistantLimiter, validate(assistantChatSchema, "body"), chat);

export default router;
