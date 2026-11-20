import { z } from "zod";
import { JOB_STATUSES } from "../../types";
import { isoDateSchema, listQueryShape, uuidSchema } from "./common";

const expectedVersion = z.number().int().min(1);
const reason = z
  .string()
  .trim()
  .min(3, { error: "Give a short reason (at least 3 characters)." })
  .max(500, { error: "Use at most 500 characters." });

export const jobPatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), expectedVersion, technicianId: uuidSchema }),
  z.object({ action: z.literal("unassign"), expectedVersion }),
  z.object({ action: z.literal("reschedule"), expectedVersion, scheduledDate: isoDateSchema, reason }),
  z.object({ action: z.literal("start"), expectedVersion }),
  z.object({ action: z.literal("cancel"), expectedVersion, reason }),
  z.object({ action: z.literal("reactivate"), expectedVersion, reason }),
]);

/** Expects already-split values (status as an array); S2 handlers convert URL search params first. */
export const jobListQuerySchema = z
  .object({
    ...listQueryShape,
    status: z.array(z.enum(JOB_STATUSES)).optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    technicianId: z.union([uuidSchema, z.literal("unassigned")]).optional(),
    planId: uuidSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    error: "The start date must be on or before the end date.",
    path: ["to"],
  });
