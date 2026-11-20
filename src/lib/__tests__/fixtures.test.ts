import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createFixtureData } from "../fixtures";
import { componentInputSchema, createCustomerSchema, createPlanSchema, createSiteSchema, uuidSchema } from "../validations";
import { validateAnswersAgainstTemplate } from "../validations/inspections";

// Fixtures must satisfy the same rules as user input, so mocks can never show data the real API would reject.
describe("synthetic fixtures conform to the contract", () => {
  const data = createFixtureData();
  const nullsToUndefined = (value: object) => Object.fromEntries(Object.entries(value).map(([key, v]) => [key, v ?? undefined]));

  it("every id is a valid UUID", () => {
    const ids = [
      ...data.profiles,
      ...data.customers,
      ...data.sites,
      ...data.systems,
      ...data.components,
      ...data.plans,
      ...data.jobs,
      ...data.inspections,
      ...data.photos,
      ...data.reports,
    ].map((item) => item.id);
    expect(z.array(uuidSchema).safeParse(ids).success).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records pass their create schemas", () => {
    for (const customer of data.customers) expect(createCustomerSchema.safeParse(nullsToUndefined(customer)).success).toBe(true);
    for (const site of data.sites) expect(createSiteSchema.safeParse(nullsToUndefined(site)).success).toBe(true);
    for (const component of data.components) expect(componentInputSchema.safeParse(nullsToUndefined(component)).success).toBe(true);
    for (const plan of data.plans) expect(createPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("foreign keys resolve and serial numbers are unique", () => {
    const ids = (items: { id: string }[]) => new Set(items.map((item) => item.id));
    const customers = ids(data.customers);
    const sites = ids(data.sites);
    const systems = ids(data.systems);
    const plans = ids(data.plans);
    expect(data.sites.every((site) => customers.has(site.customerId))).toBe(true);
    expect(data.systems.every((system) => sites.has(system.siteId))).toBe(true);
    expect(data.components.every((component) => systems.has(component.systemId))).toBe(true);
    expect(data.jobs.every((job) => plans.has(job.planId) && systems.has(job.systemId))).toBe(true);
    const serials = data.components.map((component) => component.serialNumber.toLowerCase());
    expect(new Set(serials).size).toBe(serials.length);
  });

  it("no two jobs share a (plan, date)", () => {
    const keys = data.jobs.map((job) => `${job.planId}|${job.scheduledDate}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("each completed job has exactly one inspection and report, with valid answers", () => {
    for (const job of data.jobs.filter((item) => item.status === "completed")) {
      expect(data.reports.filter((report) => report.jobId === job.id)).toHaveLength(1);
      const inspection = data.inspections.find((item) => item.jobId === job.id);
      expect(inspection).toBeDefined();
      expect(validateAnswersAgainstTemplate(data.checklistTemplate, inspection!.answers)).toEqual({});
    }
  });

  it("contains only synthetic contact details", () => {
    const emails = [...data.profiles.map((p) => p.email), ...data.customers.map((c) => c.contactEmail)].filter(Boolean) as string[];
    expect(emails.every((email) => email.endsWith("example.com"))).toBe(true);
    expect(data.customers.every((c) => c.contactPhone === null || c.contactPhone.startsWith("+961 00 000"))).toBe(true);
  });
});
