import { Router } from "express";
import {
  createDonor,
  deleteDonor,
  updateDonor,
  deleteFraudReport,
  deleteRequest,
  sendAdminPush,
  getStats,
  listComplaints,
  listDonors,
  listFraudReports,
  listRequests,
  setDonorFraudListing,
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
  adminCreateDonorSchema,
  adminDonorListSchema,
  adminFraudListSchema,
  adminLoginSchema,
  adminPushSchema,
  adminUpdateDonorSchema,
  adminRequestListSchema,
  complaintStatusSchema,
  donorStatusSchema,
  fraudListingSchema,
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
router.post("/donors", validate(adminCreateDonorSchema, "body"), createDonor);
router.patch("/donors/:id", validate(idParamSchema, "params"), validate(adminUpdateDonorSchema, "body"), updateDonor);
router.patch(
  "/donors/:id/status",
  validate(idParamSchema, "params"),
  validate(donorStatusSchema, "body"),
  updateDonorStatus,
);
router.patch(
  "/donors/:id/fraud-list",
  validate(idParamSchema, "params"),
  validate(fraudListingSchema, "body"),
  setDonorFraudListing,
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

router.post("/push", validate(adminPushSchema, "body"), sendAdminPush);

router.get("/fraud-reports", validate(adminFraudListSchema, "query"), listFraudReports);
router.patch(
  "/fraud-reports/:id/status",
  validate(idParamSchema, "params"),
  validate(fraudStatusSchema, "body"),
  updateFraudReportStatus,
);
router.delete("/fraud-reports/:id", validate(idParamSchema, "params"), deleteFraudReport);

export default router;
