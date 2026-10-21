import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";
import { otpSendDailyLimiter, otpSendLimiter, otpVerifyLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { otpSendSchema, otpVerifySchema } from "../validators/schemas.js";

const router = Router();

router.post("/send", otpSendLimiter, otpSendDailyLimiter, validate(otpSendSchema, "body"), sendOtp);
router.post("/verify", otpVerifyLimiter, validate(otpVerifySchema, "body"), verifyOtp);

export default router;
