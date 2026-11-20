import { z } from "zod";
import { COMPONENT_TYPES } from "../../types";
import { isoDateSchema, listQueryShape, optionalText, requiredText, uuidSchema } from "./common";

const hasAtMostThreeDecimals = (value: number) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6;

export const createCustomerSchema = z.object({
  displayName: requiredText(120),
  contactEmail: z.email({ error: "Enter a valid email address." }).max(254).optional(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, { error: "Enter a valid phone number." })
    .optional(),
});

export const createSiteSchema = z.object({
  customerId: uuidSchema,
  label: requiredText(120),
  addressLine1: requiredText(200),
  addressLine2: optionalText(200),
  city: requiredText(100),
  region: optionalText(100),
  postalCode: optionalText(20),
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, { error: "Use a two-letter country code, e.g. LB." })
    .transform((value) => value.toUpperCase()),
  notes: optionalText(2000),
});

const componentShape = {
  type: z.enum(COMPONENT_TYPES, { error: "Choose inverter, battery, panel or other." }),
  manufacturer: requiredText(100),
  model: requiredText(100),
  serialNumber: requiredText(100),
  installedOn: isoDateSchema,
  warrantyExpiresOn: isoDateSchema.optional(),
};

const warrantyAfterInstall = (value: { installedOn: string; warrantyExpiresOn?: string }) =>
  value.warrantyExpiresOn === undefined || value.warrantyExpiresOn >= value.installedOn;
const warrantyError = { error: "Warranty cannot end before the install date.", path: ["warrantyExpiresOn"] };

export const componentInputSchema = z.object(componentShape).refine(warrantyAfterInstall, warrantyError);

export const createSystemSchema = z
  .object({
    siteId: uuidSchema,
    label: requiredText(120),
    capacityKw: z
      .number({ error: "Capacity must be a number." })
      .positive({ error: "Capacity must be greater than 0." })
      .max(100000, { error: "Capacity looks too large." })
      .refine(hasAtMostThreeDecimals, { error: "Use at most 3 decimals." }),
    installedOn: isoDateSchema,
    components: z.array(componentInputSchema).max(200).default([]),
  })
  .superRefine((value, ctx) => {
    const seen = new Map<string, number>();
    value.components.forEach((component, index) => {
      const key = component.serialNumber.toLowerCase();
      const first = seen.get(key);
      if (first !== undefined) {
        ctx.addIssue({ code: "custom", message: "Serial number is repeated in this form.", path: ["components", index, "serialNumber"] });
      } else {
        seen.set(key, index);
      }
    });
  });

export const createComponentSchema = z
  .object({ ...componentShape, systemId: uuidSchema, replacesComponentId: uuidSchema.optional() })
  .refine(warrantyAfterInstall, warrantyError);

export const customerListQuerySchema = z.object({
  ...listQueryShape,
  sort: z.enum(["displayName", "createdAt"]).optional(),
});

export const systemListQuerySchema = z.object({
  ...listQueryShape,
  customerId: uuidSchema.optional(),
  siteId: uuidSchema.optional(),
});
