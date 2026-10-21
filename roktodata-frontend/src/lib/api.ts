import type {
  BloodGroup,
  BloodRequest,
  ComplaintReason,
  ComplaintStatus,
  Donor,
  DonorStatus,
  FraudEntry,
  FraudReason,
  FraudReportStatus,
  RequestStatus,
} from "@/lib/data";

// Trailing slashes are stripped so "https://api.example.com/" doesn't produce "//api/..." paths.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

// An error whose message comes from the API and is safe to show to the user (in Bangla).
// `code` identifies specific cases, e.g. "DUPLICATE_REQUEST".
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code?: string,
  ) {
    super(message);
  }
}

const OFFLINE_MESSAGE = "সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isCallerAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

// Gives up on a single attempt after `ms`, while still honouring the caller's own abort signal.
function withTimeout(signal: AbortSignal | null | undefined, ms: number): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !("timeout" in AbortSignal)) return signal ?? undefined;
  const timeout = AbortSignal.timeout(ms);
  if (!signal) return timeout;
  return "any" in AbortSignal ? AbortSignal.any([signal, timeout]) : signal;
}

async function request<T>(path: string, init?: RequestInit, { retries = 0 } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, signal: retries ? withTimeout(init?.signal, 30_000) : init?.signal });
  } catch (err) {
    if (isCallerAbort(err) && init?.signal?.aborted) throw err;
    // Network error or our per-attempt timeout: the free-tier server may still be waking up.
    if (retries > 0) {
      await wait(3000);
      return request<T>(path, init, { retries: retries - 1 });
    }
    throw new ApiError(OFFLINE_MESSAGE);
  }

  // The hosting proxy answers 502/503/504 while the API is starting.
  if (retries > 0 && [502, 503, 504].includes(res.status)) {
    await wait(3000);
    return request<T>(path, init, { retries: retries - 1 });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new ApiError(data?.message ?? "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।", res.status, data?.code);
  }
  return data as T;
}

function jsonRequest(method: string, body?: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };
}

const toQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim()) query.set(key, String(value).trim());
  }
  return query.toString();
};

// ---- Public ----

// Starts the API early (e.g. on page load) so it is awake by the time the user searches.
// The free hosting plan puts the server to sleep after a period without visitors.
export function warmUpApi() {
  fetch(`${API_URL}/api/health`, { cache: "no-store" }).catch(() => {});
}

export interface SearchResult {
  message?: string;
  count: number;
  donors: Donor[];
}

export interface DonorSearchFilters {
  bloodGroup?: string;
  district?: string;
  upazila?: string;
}

// One page of the donor search; `total` is the number of matching donors across all pages.
export interface DonorSearchPage {
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  donors: Donor[];
}

export function searchDonors(filters: DonorSearchFilters, page: number, signal?: AbortSignal) {
  return request<DonorSearchPage>(`/api/donors/search?${toQuery({ ...filters, page })}`, { signal }, { retries: 2 });
}

export interface DonorPayload {
  fullName: string;
  phoneNumber: string;
  bloodGroup: BloodGroup;
  district: string;
  upazila: string;
  lastDonationDate?: string;
  isReadyToDonate: boolean;
  // With "not ready": back in search by itself after this many months (null = until changed).
  readyAgainMonths?: ReadyAgainMonths | null;
}

export type ReadyAgainMonths = 1 | 3 | 6;

// Creates the donor (pending admin approval), or updates them if the phone number already exists.
// When phone verification is on, the Firebase ID token proves the user owns the phone number.
// Sends a 6-digit SMS code. Fails with ApiError code "OTP_COOLDOWN" (wait before resending),
// "OTP_DAILY_LIMIT" or "SMS_FAILED".
export function sendOtp(phoneNumber: string) {
  return request<{ message: string; expiresInSeconds: number; resendInSeconds: number }>(
    "/api/otp/send",
    jsonRequest("POST", { phoneNumber }),
    { retries: 2 },
  );
}

// Exchanges the code for a short-lived token proving the number belongs to the user.
export function verifyOtp(phoneNumber: string, code: string) {
  return request<{ message: string; verificationToken: string; expiresInSeconds: number }>(
    "/api/otp/verify",
    jsonRequest("POST", { phoneNumber, code }),
  );
}

// How a name will be saved and shown on the site (English parts converted to Bangla).
export function previewName(name: string, signal?: AbortSignal) {
  return request<{ fullName: string }>(`/api/donors/name-preview?${new URLSearchParams({ name })}`, { signal });
}

// `verificationToken` comes from verifyOtp; the server requires it while phone verification is on.
export function registerOrUpdateDonor(donor: DonorPayload, verificationToken?: string) {
  return request<{ message: string; isNew: boolean; status: DonorStatus; fullName: string }>(
    "/api/donors/register-or-update",
    jsonRequest("POST", donor, verificationToken ? { Authorization: `Bearer ${verificationToken}` } : {}),
  );
}

export interface PatientRequestPayload {
  patientName: string;
  requiredBloodGroup: BloodGroup;
  district: string;
  upazila?: string;
  hospitalAddress?: string;
  reason?: string;
  requesterPhone: string;
  bagsNeeded: number;
  neededDate?: string;
}

// Saves the request for admin review and returns donors in the same upazila (`donors`)
// and elsewhere in the same district (`nearbyDonors`). One request per phone number per day:
// a repeat fails with ApiError code "DUPLICATE_REQUEST".
export function searchForPatient(payload: PatientRequestPayload) {
  return request<SearchResult & { total: number; nearbyDonors: Donor[]; nearbyTotal: number }>(
    "/api/patient/search-and-log",
    jsonRequest("POST", payload),
  );
}

export interface Paginated {
  total: number;
  page: number;
  pages: number;
}

// Public feed of admin-approved blood requests.
export function getBloodRequests(params: { bloodGroup?: string; district?: string; page?: number }) {
  return request<Paginated & { requests: BloodRequest[] }>(`/api/patient/requests?${toQuery(params)}`);
}

export interface ComplaintPayload {
  donorId: string;
  complainantPhone: string;
  reason: ComplaintReason;
  details?: string;
}

export function submitComplaint(payload: ComplaintPayload) {
  return request<{ message: string }>("/api/complaints", jsonRequest("POST", payload));
}

// ---- Fraud reports ----

export interface FraudReportPayload {
  phoneNumber: string;
  name: string;
  reason: FraudReason;
  details: string;
  reporterPhone: string;
}

// Submits a report for admin review; it appears publicly only after approval.
export function submitFraudReport(payload: FraudReportPayload) {
  return request<{ message: string }>("/api/fraud-reports", jsonRequest("POST", payload));
}

export function getFraudEntries(page = 1) {
  return request<Paginated & { entries: FraudEntry[] }>(`/api/fraud-reports?${toQuery({ page })}`);
}

// Whether a number has admin-approved fraud reports against it.
export function checkFraudNumber(phone: string) {
  return request<{ phoneNumber: string; isFraud: boolean; entry: FraudEntry | null }>(
    `/api/fraud-reports/check?${toQuery({ phone })}`,
  );
}

// ---- Photo cards ----

// A new serial number for a photo card (the running count of cards made).
export function getPhotoCardSerial() {
  return request<{ serial: number }>("/api/photocards/serial", { method: "POST" }, { retries: 1 });
}

// ---- Admin ----

export interface AdminStats {
  pending: number;
  active: number;
  blocked: number;
  openComplaints: number;
  pendingRequests: number;
  pendingFraudReports: number;
  photoCards: number; // photo cards made so far (the latest serial number)
}

export interface AdminDonor extends Donor {
  isReadyToDonate: boolean;
  // While not ready: the date they become ready again by themselves (YYYY-MM-DD), or null.
  readyAgainAt: string | null;
  status: DonorStatus;
  // Why the admin blocked them (shown in the public fraud list); "" unless Blocked.
  blockReason: string;
  // Blocked and currently shown in the public fraud list.
  inFraudList: boolean;
  createdAt: string;
  openComplaints: number;
}

export interface AdminComplaint {
  id: string;
  complainantPhone: string;
  reason: ComplaintReason;
  reasonLabel: string;
  details: string;
  status: ComplaintStatus;
  createdAt: string;
  donor: (Pick<Donor, "id" | "fullName" | "phoneNumber" | "bloodGroup" | "district" | "upazila"> & { status: DonorStatus }) | null;
}

const auth =(token: string) => ({ Authorization: `Bearer ${token}` });

export function adminLogin(username: string, password: string) {
  return request<{ token: string; message: string }>(
    "/api/admin/login",
    jsonRequest("POST", { username, password }),
  );
}

export function getAdminStats(token: string) {
  return request<{ stats: AdminStats }>("/api/admin/stats", { headers: auth(token) });
}

export function getAdminDonors(token: string, params: { status?: DonorStatus; q?: string; page?: number }) {
  return request<Paginated & { donors: AdminDonor[] }>(`/api/admin/donors?${toQuery(params)}`, {
    headers: auth(token),
  });
}

// Blocking needs a reason, which is shown publicly in the fraud list.
export function setDonorStatus(token: string, id: string, status: DonorStatus, reason?: string) {
  return request<{ message: string }>(
    `/api/admin/donors/${id}/status`,
    jsonRequest("PATCH", { status, reason }, auth(token)),
  );
}

// Shows or hides a blocked donor in the public fraud list (they stay blocked).
export function setDonorFraudListing(token: string, id: string, listed: boolean) {
  return request<{ message: string }>(`/api/admin/donors/${id}/fraud-list`, jsonRequest("PATCH", { listed }, auth(token)));
}

export function deleteDonor(token: string, id: string) {
  return request<{ message: string }>(`/api/admin/donors/${id}`, jsonRequest("DELETE", undefined, auth(token)));
}

export function getAdminComplaints(token: string, params: { status?: ComplaintStatus; page?: number }) {
  return request<Paginated & { complaints: AdminComplaint[] }>(`/api/admin/complaints?${toQuery(params)}`, {
    headers: auth(token),
  });
}

export function setComplaintStatus(token: string, id: string, status: ComplaintStatus) {
  return request<{ message: string }>(
    `/api/admin/complaints/${id}/status`,
    jsonRequest("PATCH", { status }, auth(token)),
  );
}

export function getAdminRequests(token: string, params: { status?: RequestStatus; page?: number }) {
  return request<Paginated & { requests: BloodRequest[] }>(`/api/admin/requests?${toQuery(params)}`, {
    headers: auth(token),
  });
}

export function setRequestStatus(token: string, id: string, status: RequestStatus, note?: string) {
  return request<{ message: string }>(
    `/api/admin/requests/${id}/status`,
    jsonRequest("PATCH", { status, note }, auth(token)),
  );
}

// Empty note clears it.
export function setRequestNote(token: string, id: string, note: string) {
  return request<{ message: string }>(`/api/admin/requests/${id}/note`, jsonRequest("PATCH", { note }, auth(token)));
}

export function deleteRequest(token: string, id: string) {
  return request<{ message: string }>(`/api/admin/requests/${id}`, jsonRequest("DELETE", undefined, auth(token)));
}

export interface AdminFraudReport {
  id: string;
  phoneNumber: string;
  name: string;
  reason: FraudReason;
  reasonLabel: string;
  details: string;
  reporterPhone: string;
  status: FraudReportStatus;
  createdAt: string;
  approvedReportsForNumber: number;
  donor?: { id: string; fullName: string; bloodGroup: string; status: DonorStatus };
}

export function getAdminFraudReports(token: string, params: { status?: FraudReportStatus; page?: number }) {
  return request<Paginated & { reports: AdminFraudReport[] }>(`/api/admin/fraud-reports?${toQuery(params)}`, {
    headers: auth(token),
  });
}

export function setFraudReportStatus(token: string, id: string, status: FraudReportStatus) {
  return request<{ message: string }>(
    `/api/admin/fraud-reports/${id}/status`,
    jsonRequest("PATCH", { status }, auth(token)),
  );
}

export function deleteFraudReport(token: string, id: string) {
  return request<{ message: string }>(`/api/admin/fraud-reports/${id}`, jsonRequest("DELETE", undefined, auth(token)));
}
