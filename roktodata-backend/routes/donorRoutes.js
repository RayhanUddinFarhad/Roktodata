import { Router } from "express";
import { registerOrUpdateDonor, searchDonors } from "../controllers/donorController.js";
import { registerLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { phoneVerification } from "../middleware/verifyFirebaseToken.js";
import { registerDonorSchema, searchDonorsSchema } from "../validators/schemas.js";

const router = Router();

router.post(
  "/register-or-update",
  registerLimiter,
  phoneVerification,
  validate(registerDonorSchema, "body"),
  registerOrUpdateDonor,
);

router.get("/search", validate(searchDonorsSchema, "query"), searchDonors);

export default router;
