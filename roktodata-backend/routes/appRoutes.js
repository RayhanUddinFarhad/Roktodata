import { Router } from "express";
import { recordInstall } from "../controllers/appController.js";
import { pushLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { appInstallSchema } from "../validators/schemas.js";

const router = Router();

router.post("/install", pushLimiter, validate(appInstallSchema, "body"), recordInstall);

export default router;
