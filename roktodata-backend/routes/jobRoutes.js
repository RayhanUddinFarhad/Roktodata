import { Router } from "express";
import { requireJobSecret, sendEligibilityReminders } from "../controllers/jobController.js";

const router = Router();

router.post("/eligibility-reminders", requireJobSecret, sendEligibilityReminders);

export default router;
