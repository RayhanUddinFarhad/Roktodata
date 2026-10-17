import { Router } from "express";
import {
  deleteDonor,
  deleteFraudReport,
  deleteRequest,
  getStats,
  listComplaints,
  listDonors,
  listFraudReports,
  listRequests,
  login,
  updateComplaintStatus,
  updateDonorStatus,
  updateFraudReportStatus,
  updateRequestNote,
  updateRequestStatus,
} from "../controllers/adminController.js";
import { adminLoginLimiter } from "../middleware/rateLimiters.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validate } from "../middleware/validate.js";
import {
  adminComplaintListSchema,
  adminDonorListSchema,
  adminFraudListSchema,
  adminLoginSchema,
  adminRequestListSchema,
  complaintStatusSchema,
  donorStatusSchema,
  fraudStatusSchema,
  idParamSchema,
  requestNoteSchema,
  requestStatusSchema,
} from "../validators/schemas.js";

const router = Router();

router.post("/login", adminLoginLimiter, validate(adminLoginSchema, "body"), login);

// Everything below requires an admin token.
router.use(requireAdmin);

router.get("/stats", getStats);

router.get("/donors", validate(adminDonorListSchema, "query"), listDonors);
router.patch(
  "/donors/:id/status",
  validate(idParamSchema, "params"),
  validate(donorStatusSchema, "body"),
  updateDonorStatus,
);
router.delete("/donors/:id", validate(idParamSchema, "params"), deleteDonor);

router.get("/complaints", validate(adminComplaintListSchema, "query"), listComplaints);
router.patch(
  "/complaints/:id/status",
  validate(idParamSchema, "params"),
  validate(complaintStatusSchema, "body"),
  updateComplaintStatus,
);

router.get("/requests", validate(adminRequestListSchema, "query"), listRequests);
router.patch(
  "/requests/:id/status",
  validate(idParamSchema, "params"),
  validate(requestStatusSchema, "body"),
  updateRequestStatus,
);
router.patch(
  "/requests/:id/note",
  validate(idParamSchema, "params"),
  validate(requestNoteSchema, "body"),
  updateRequestNote,
);
router.delete("/requests/:id", validate(idParamSchema, "params"), deleteRequest);

router.get("/fraud-reports", validate(adminFraudListSchema, "query"), listFraudReports);
router.patch(
  "/fraud-reports/:id/status",
  validate(idParamSchema, "params"),
  validate(fraudStatusSchema, "body"),
  updateFraudReportStatus,
);
router.delete("/fraud-reports/:id", validate(idParamSchema, "params"), deleteFraudReport);

export default router;
