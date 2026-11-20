import { z } from "zod";
import { MAX_PAGE_SIZE, SORT_DIRECTIONS } from "../../types";
import { isValidIsoDate } from "./dates";

export const uuidSchema = z.uuid({ error: "Must be a valid ID." });

export const isoDateSchema = z.string().refine(isValidIsoDate, { error: "Enter a real date as YYYY-MM-DD." });

/** Required text: trimmed, not blank. */
export const requiredText = (max: number) =>
  z.string().trim().min(1, { error: "This field is required." }).max(max, { error: `Use at most ${max} characters.` });

/** Optional text. Forms should omit empty fields (see omitEmptyStrings). */
export const optionalText = (max: number) =>
  z.string().trim().max(max, { error: `Use at most ${max} characters.` }).optional();

export const listQueryShape = {
  page: z.coerce.number().int().min(1, { error: "Page starts at 1." }).optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, { error: "Page size must be at least 1." })
    .max(MAX_PAGE_SIZE, { error: `Page size is at most ${MAX_PAGE_SIZE}.` })
    .optional(),
  q: z.string().trim().max(100).optional(),
  sortDirection: z.enum(SORT_DIRECTIONS).optional(),
};

export const listQuerySchema = z.object(listQueryShape);

/**
 * Form helper: drops keys whose value is an empty or whitespace-only string, so optional fields left
 * blank are omitted instead of failing format checks (e.g. an empty optional email).
 */
export function omitEmptyStrings<T extends Record<string, unknown>>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => !(typeof value === "string" && value.trim() === "")),
  ) as Partial<T>;
}
