import { Router } from "express";
import { confirmSerial, reserveSerial } from "../controllers/photocardController.js";
import { photocardLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { serialConfirmSchema, serialReserveSchema } from "../validators/schemas.js";

const router = Router();

router.post("/serial/reserve", photocardLimiter, validate(serialReserveSchema, "body"), reserveSerial);
router.post("/serial/confirm", validate(serialConfirmSchema, "body"), confirmSerial);

export default router;
