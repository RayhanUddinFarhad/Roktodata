import { Router } from "express";
import { createFeedback, listFeedback } from "../controllers/feedbackController.js";
import { feedbackLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { feedbackListSchema, feedbackSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", validate(feedbackListSchema, "query"), listFeedback);
router.post("/", feedbackLimiter, validate(feedbackSchema, "body"), createFeedback);

export default router;
