import { FEEDBACK_ROLES } from "../config/constants.js";
import { Feedback } from "../models/Feedback.js";
import { AppError } from "../utils/AppError.js";

const ADMIN_PAGE_SIZE = 20;

const toPublicFeedback = (feedback) => ({
  id: feedback._id.toString(),
  name: feedback.name,
  district: feedback.district,
  upazila: feedback.upazila,
  role: feedback.role,
  roleLabel: FEEDBACK_ROLES[feedback.role],
  message: feedback.message,
  date: (feedback.approvedAt ?? feedback.createdAt).toISOString().slice(0, 10),
});

// POST /api/feedback
export async function createFeedback(req, res) {
  const { website, ...feedback } = req.validated;
  // Filled in only by bots (the field is hidden); answer as usual but keep nothing.
  if (!website) await Feedback.create({ ...feedback, upazila: feedback.upazila ?? "", phoneNumber: feedback.phoneNumber ?? null });
  res.status(201).json({
    success: true,
    message: "ধন্যবাদ! আপনার ফিডব্যাক জমা হয়েছে। অ্যাডমিন দেখে অনুমোদন দিলে সাইটে দেখা যাবে।",
  });
}

// GET /api/feedback?page=&limit=
export async function listFeedback(req, res) {
  const { page, limit } = req.validated;
  const filter = { status: "Approved" };
  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ approvedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Feedback.countDocuments(filter),
  ]);
  res.json({ success: true, total, page, pages: Math.max(1, Math.ceil(total / limit)), feedback: items.map(toPublicFeedback) });
}

// ---- Admin ----

// GET /api/admin/feedback?status=&page=
export async function listFeedbackAdmin(req, res) {
  const { status, page } = req.validated;
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip((page - 1) * ADMIN_PAGE_SIZE).limit(ADMIN_PAGE_SIZE).lean(),
    Feedback.countDocuments(filter),
  ]);
  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    feedback: items.map((item) => ({
      ...toPublicFeedback(item),
      phoneNumber: item.phoneNumber,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

// PATCH /api/admin/feedback/:id/status
export async function updateFeedbackStatus(req, res) {
  const { id, status } = req.validated;
  const feedback = await Feedback.findById(id);
  if (!feedback) throw new AppError(404, "ফিডব্যাক পাওয়া যায়নি।");
  // Approving again keeps its first approval time, so its place in the list doesn't jump.
  if (status === "Approved" && !feedback.approvedAt) feedback.approvedAt = new Date();
  feedback.status = status;
  await feedback.save();
  const messages = {
    Approved: "ফিডব্যাকটি অনুমোদিত হয়েছে, সাইটে দেখানো হচ্ছে।",
    Rejected: "ফিডব্যাকটি বাতিল করা হয়েছে।",
    Pending: "ফিডব্যাকটি আবার অপেক্ষমাণ তালিকায় রাখা হয়েছে।",
  };
  res.json({ success: true, status: feedback.status, message: messages[status] });
}

// PATCH /api/admin/feedback/:id
export async function updateFeedback(req, res) {
  const { id, ...changes } = req.validated;
  const feedback = await Feedback.findById(id);
  if (!feedback) throw new AppError(404, "ফিডব্যাক পাওয়া যায়নি।");
  // The area is edited as a pair: a district sent without a thana means "no thana".
  if (changes.district) changes.upazila ??= "";
  feedback.set(changes);
  await feedback.save();
  res.json({ success: true, message: "ফিডব্যাক আপডেট করা হয়েছে।" });
}

// DELETE /api/admin/feedback/:id
export async function deleteFeedback(req, res) {
  const { id } = req.validated;
  const feedback = await Feedback.findByIdAndDelete(id);
  if (!feedback) throw new AppError(404, "ফিডব্যাক পাওয়া যায়নি।");
  res.json({ success: true, message: "ফিডব্যাকটি মুছে ফেলা হয়েছে।" });
}

export const pendingFeedbackCount = () => Feedback.countDocuments({ status: "Pending" });
