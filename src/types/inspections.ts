import type { IsoDate, IsoDateTime, Uuid } from "./common";
import type { ComponentType } from "./registry";

// ---------- Checklist template (content owned by PC-S1-04, shape owned here) ----------

export const CHECKLIST_ITEM_KINDS = ["boolean", "number", "text", "choice"] as const;
export type ChecklistItemKind = (typeof CHECKLIST_ITEM_KINDS)[number];

export interface ChecklistItem {
  /** Stable key, e.g. "dc_voltage". Never reused for a different meaning across versions. */
  id: string;
  label: string;
  kind: ChecklistItemKind;
  required: boolean;
  /** Measurement unit for kind "number", e.g. "V", "kW", "%". */
  unit?: string;
  min?: number;
  max?: number;
  /** Allowed values for kind "choice". */
  options?: string[];
  helpText?: string;
}

export interface ChecklistTemplate {
  version: number;
  title: string;
  items: ChecklistItem[];
}

/** Answers keyed by ChecklistItem.id. Measurements are "number" items; their unit comes from the template. */
export type ChecklistAnswerValue = boolean | number | string;
export type ChecklistAnswers = Record<string, ChecklistAnswerValue>;

// ---------- Customer confirmation (D06 proposal: typed name, not a legal signature) ----------

export interface CustomerConfirmationInput {
  typedName: string;
  acknowledged: true;
}

export interface CustomerConfirmation extends CustomerConfirmationInput {
  confirmedAt: IsoDateTime;
}

// ---------- Photos (private evidence; blobs live in storage, never in rows) ----------

export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoMimeType = (typeof PHOTO_MIME_TYPES)[number];
/** Upper bound per photo. Target size is ~1 MB (docs/HOSTING_COSTS.md); retention policy pending D07. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_JOB = 10;

export interface RegisterPhotoRequest {
  jobId: Uuid;
  fileName: string;
  mimeType: PhotoMimeType;
  sizeBytes: number;
  caption?: string;
}

/** Photo as returned to clients. The private storage path is never exposed. */
export interface InspectionPhoto {
  id: Uuid;
  jobId: Uuid;
  caption: string | null;
  mimeType: PhotoMimeType;
  sizeBytes: number;
  /** Short-lived signed URL when the caller may view it; null in S1 mocks (nothing is uploaded). */
  url: string | null;
  uploadedAt: IsoDateTime;
}

// ---------- Completion ----------

/** POST /api/jobs/:id/complete (assigned technician). Repeating the same idempotencyKey returns the same report. */
export interface CompleteJobRequest {
  checklistVersion: number;
  answers: ChecklistAnswers;
  notes?: string;
  photoIds: Uuid[];
  confirmation: CustomerConfirmationInput;
  /** Client-generated UUID, reused on retry of the same submission. */
  idempotencyKey: Uuid;
}

export interface Inspection {
  id: Uuid;
  jobId: Uuid;
  checklistVersion: number;
  answers: ChecklistAnswers;
  notes: string | null;
  confirmation: CustomerConfirmation;
  submittedAt: IsoDateTime;
}

// ---------- Service report (immutable snapshot) ----------

export interface ReportChecklistLine {
  itemId: string;
  label: string;
  kind: ChecklistItemKind;
  unit: string | null;
  value: ChecklistAnswerValue | null;
}

/** Copied at completion time so later edits to customer/system records never rewrite history. */
export interface ReportSnapshot {
  customer: { id: Uuid; displayName: string };
  site: { id: Uuid; label: string; address: string };
  system: { id: Uuid; label: string; capacityKw: number };
  components: { id: Uuid; type: ComponentType; manufacturer: string; model: string; serialNumber: string }[];
  job: { id: Uuid; scheduledDate: IsoDate; completedAt: IsoDateTime; technicianId: Uuid; technicianName: string };
  checklist: { version: number; title: string; lines: ReportChecklistLine[] };
  notes: string | null;
  photos: { id: Uuid; caption: string | null }[];
  confirmation: CustomerConfirmation;
}

/** GET /api/reports/:id. Exactly one per completed job. */
export interface ServiceReport {
  id: Uuid;
  jobId: Uuid;
  inspectionId: Uuid;
  generatedAt: IsoDateTime;
  snapshot: ReportSnapshot;
}
