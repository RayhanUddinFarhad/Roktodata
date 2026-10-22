import { Router } from "express";
import { linkDonor, pushKey, subscribe, unsubscribe } from "../controllers/pushController.js";
import { pushLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "../validators/schemas.js";

const router = Router();

router.get("/key", pushKey);
router.post("/subscribe", pushLimiter, validate(pushSubscribeSchema, "body"), subscribe);
router.post("/link", pushLimiter, validate(pushUnsubscribeSchema, "body"), linkDonor);
router.post("/unsubscribe", pushLimiter, validate(pushUnsubscribeSchema, "body"), unsubscribe);

export default router;
