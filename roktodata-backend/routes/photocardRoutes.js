import { Router } from "express";
import { issueSerial } from "../controllers/photocardController.js";
import { photocardLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/serial", photocardLimiter, issueSerial);

export default router;
