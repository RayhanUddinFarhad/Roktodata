import { Router } from "express";
import { donorStats, previewName, registerOrUpdateDonor, searchDonors } from "../controllers/donorController.js";
import { registerLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { requirePhoneVerification } from "../middleware/requirePhoneVerification.js";
import { namePreviewSchema, registerDonorSchema, searchDonorsSchema } from "../validators/schemas.js";

const router = Router();

router.post(
  "/register-or-update",
  registerLimiter,
  requirePhoneVerification,
  validate(registerDonorSchema, "body"),
  registerOrUpdateDonor,
);

router.get("/search", validate(searchDonorsSchema, "query"), searchDonors);
router.get("/stats", donorStats);
router.get("/name-preview", validate(namePreviewSchema, "query"), previewName);

export default router;
