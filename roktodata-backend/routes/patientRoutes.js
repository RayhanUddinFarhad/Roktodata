import { Router } from "express";
import { listPublicRequests, searchAndLog } from "../controllers/patientController.js";
import { patientSearchLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { patientSearchSchema, requestFeedSchema } from "../validators/schemas.js";

const router = Router();

router.post("/search-and-log", patientSearchLimiter, validate(patientSearchSchema, "body"), searchAndLog);
router.get("/requests", validate(requestFeedSchema, "query"), listPublicRequests);

export default router;
