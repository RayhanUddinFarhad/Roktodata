import { Router } from "express";
import { checkFraudNumber, createFraudReport, listFraudEntries } from "../controllers/fraudController.js";
import { fraudReportLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { fraudCheckSchema, fraudListSchema, fraudReportSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", validate(fraudListSchema, "query"), listFraudEntries);
router.get("/check", validate(fraudCheckSchema, "query"), checkFraudNumber);
router.post("/", fraudReportLimiter, validate(fraudReportSchema, "body"), createFraudReport);

export default router;
