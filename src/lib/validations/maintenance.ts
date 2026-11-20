import { z } from "zod";
import { BUSINESS_TIMEZONES, MAX_INTERVAL_MONTHS, MIN_INTERVAL_MONTHS, PLAN_STATUSES } from "../../types";
import { isoDateSchema, listQueryShape, uuidSchema } from "./common";

export const intervalMonthsSchema = z
  .number({ error: "Interval must be a number of months." })
  .int({ error: "Interval must be a whole number of months." })
  .min(MIN_INTERVAL_MONTHS, { error: `Interval must be at least ${MIN_INTERVAL_MONTHS} month.` })
  .max(MAX_INTERVAL_MONTHS, { error: `Interval must be at most ${MAX_INTERVAL_MONTHS} months.` });

export const createPlanSchema = z.object({
  systemId: uuidSchema,
  intervalMonths: intervalMonthsSchema,
  anchorDate: isoDateSchema,
  timezone: z.enum(BUSINESS_TIMEZONES, { error: "Unsupported business timezone." }),
});

export const updatePlanSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    intervalMonths: intervalMonthsSchema.optional(),
    anchorDate: isoDateSchema.optional(),
    status: z.enum(PLAN_STATUSES).optional(),
  })
  .refine((value) => value.intervalMonths !== undefined || value.anchorDate !== undefined || value.status !== undefined, {
    error: "Change at least one field.",
  });

export const planListQuerySchema = z.object({
  ...listQueryShape,
  systemId: uuidSchema.optional(),
  status: z.enum(PLAN_STATUSES).optional(),
});

export const generateJobsSchema = z.object({
  planId: uuidSchema.optional(),
});
