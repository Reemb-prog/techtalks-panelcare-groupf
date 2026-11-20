/**
 * MOCK inspections adapter: checklist, photo registration and job completion.
 * Photos are NOT uploaded in S1: only metadata is recorded and url stays null.
 */
import type { InspectionPhoto, InspectionsAdapter, ReportSnapshot, ServiceReport } from "../../../types";
import { MAX_PHOTOS_PER_JOB } from "../../../types";
import type { StoredInspection, StoredPhoto } from "../../fixtures/data";
import { completeJobSchema, parseRequest, registerPhotoSchema, validateAnswersAgainstTemplate } from "../../validations";
import { canViewJob, evaluateTransition } from "../../validations/job-status";
import { profileName, systemContext } from "../mock/lookups";
import { failure, fromError, nowIso, simulate, success, TECHNICIAN_ONLY, type MockContext } from "../mock/runtime";

/** Strip the private storage path before anything leaves the adapter. */
function publicPhoto(stored: StoredPhoto): InspectionPhoto {
  const photo: Partial<StoredPhoto> = { ...stored };
  delete photo.storagePath;
  return photo as InspectionPhoto;
}

export function createMockInspectionsAdapter(ctx: MockContext): InspectionsAdapter {
  return {
    source: "mock",

    getChecklistTemplate: () => simulate(ctx, {}, () => success(ctx.store.checklistTemplate)),

    registerPhoto: (request) =>
      simulate(ctx, { roles: TECHNICIAN_ONLY }, (session) => {
        const parsed = parseRequest(registerPhotoSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const job = ctx.store.jobs.find((item) => item.id === parsed.data.jobId);
        if (!job || !canViewJob(session, job)) return failure("NOT_FOUND", "Job not found.");
        if (job.status !== "assigned" && job.status !== "in_progress") {
          return failure("CONFLICT", "Photos can only be added to an open job.");
        }
        if (ctx.store.photos.filter((photo) => photo.jobId === job.id).length >= MAX_PHOTOS_PER_JOB) {
          return failure("CONFLICT", `A job can have at most ${MAX_PHOTOS_PER_JOB} photos.`);
        }
        const id = ctx.newId();
        const extension = parsed.data.mimeType.split("/")[1];
        const photo: StoredPhoto = {
          id,
          jobId: job.id,
          caption: parsed.data.caption ?? null,
          mimeType: parsed.data.mimeType,
          sizeBytes: parsed.data.sizeBytes,
          url: null,
          uploadedAt: nowIso(ctx),
          storagePath: `inspections/${job.id}/${id}.${extension}`,
        };
        ctx.store.photos.push(photo);
        return success(publicPhoto(photo), 201);
      }),

    completeJob: (jobId, request) =>
      simulate(ctx, { roles: TECHNICIAN_ONLY }, (session) => {
        const parsed = parseRequest(completeJobSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const body = parsed.data;
        const job = ctx.store.jobs.find((item) => item.id === jobId);
        if (!job || !canViewJob(session, job)) return failure("NOT_FOUND", "Job not found.");

        // Idempotent retry: the same submission returns the same single report.
        if (job.status === "completed") {
          const previous = ctx.store.inspections.find((inspection) => inspection.jobId === job.id);
          const report = ctx.store.reports.find((item) => item.jobId === job.id);
          if (previous?.idempotencyKey === body.idempotencyKey && report) return success(report);
          return failure("CONFLICT", "This job is already completed.");
        }
        const outcome = evaluateTransition(session, job, "complete");
        if (!outcome.ok) return failure(outcome.code, outcome.message);

        const template = ctx.store.checklistTemplate;
        if (body.checklistVersion !== template.version) {
          return failure("CONFLICT", "The checklist was updated. Reload the job and try again.");
        }
        const answerErrors = validateAnswersAgainstTemplate(template, body.answers);
        if (Object.keys(answerErrors).length) return failure("VALIDATION_FAILED", "Some checklist items need attention.", answerErrors);
        const photos = body.photoIds.map((id) => ctx.store.photos.find((photo) => photo.id === id && photo.jobId === job.id));
        if (photos.some((photo) => !photo)) {
          return failure("VALIDATION_FAILED", "Some photos could not be found.", { photoIds: ["Remove the missing photos and try again."] });
        }

        const { system, site, customer } = systemContext(ctx.store, job.systemId);
        if (!system || !site || !customer) return failure("INTERNAL", "Job data is incomplete.");
        const at = nowIso(ctx);
        const confirmation = { ...body.confirmation, confirmedAt: at };
        const inspection: StoredInspection = {
          id: ctx.newId(),
          jobId: job.id,
          checklistVersion: template.version,
          answers: body.answers,
          notes: body.notes ?? null,
          confirmation,
          submittedAt: at,
          idempotencyKey: body.idempotencyKey,
        };
        // Snapshot copies current values so later registry edits never rewrite this report.
        const snapshot: ReportSnapshot = {
          customer: { id: customer.id, displayName: customer.displayName },
          site: { id: site.id, label: site.label, address: `${site.addressLine1}, ${site.city}, ${site.country}` },
          system: { id: system.id, label: system.label, capacityKw: system.capacityKw },
          components: ctx.store.components
            .filter((component) => component.systemId === system.id && component.status === "active")
            .map(({ id, type, manufacturer, model, serialNumber }) => ({ id, type, manufacturer, model, serialNumber })),
          job: { id: job.id, scheduledDate: job.scheduledDate, completedAt: at, technicianId: session.userId, technicianName: profileName(ctx.store, session.userId) ?? session.displayName },
          checklist: {
            version: template.version,
            title: template.title,
            lines: template.items.map((item) => ({ itemId: item.id, label: item.label, kind: item.kind, unit: item.unit ?? null, value: body.answers[item.id] ?? null })),
          },
          notes: inspection.notes,
          photos: photos.map((photo) => ({ id: photo!.id, caption: photo!.caption })),
          confirmation,
        };
        const report: ServiceReport = { id: ctx.newId(), jobId: job.id, inspectionId: inspection.id, generatedAt: at, snapshot };

        ctx.store.inspections.push(inspection);
        ctx.store.reports.push(report);
        job.status = outcome.next;
        job.completedAt = at;
        job.version += 1;
        job.updatedAt = at;
        return success(report, 201);
      }),

    // Coordinators read any report; technicians only reports for jobs assigned to them.
    getReport: (id) =>
      simulate(ctx, {}, (session) => {
        const report = ctx.store.reports.find((item) => item.id === id);
        const job = report && ctx.store.jobs.find((item) => item.id === report.jobId);
        if (!report || !job || !canViewJob(session, job)) return failure("NOT_FOUND", "Report not found.");
        return success(report);
      }),
  };
}
