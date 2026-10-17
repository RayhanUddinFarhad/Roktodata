import { Router } from "express";
import { createComplaint } from "../controllers/complaintController.js";
import { complaintLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { complaintSchema } from "../validators/schemas.js";

const router = Router();

router.post("/", complaintLimiter, validate(complaintSchema, "body"), createComplaint);

export default router;
