/**
 * SYNTHETIC demo data for S1 mocks and tests. Every person, company, address, email and phone number is
 * invented (example.com, placeholder numbers). Never replace with real customer data.
 * Reference "today" is 2026-11-20 (Asia/Beirut); the 90-day window ends (exclusive) on 2027-02-18.
 */
import type {
  ChecklistTemplate,
  Component,
  ComponentType,
  Customer,
  Inspection,
  InspectionPhoto,
  IsoDate,
  MaintenanceJob,
  MaintenancePlan,
  Profile,
  ServiceReport,
  Site,
  SolarSystem,
} from "../../types";
import { fixtureId as id } from "./ids";

export const FIXTURE_TODAY: IsoDate = "2026-11-20";
/** 10:00 in Beirut on FIXTURE_TODAY. */
export const FIXTURE_NOW = "2026-11-20T08:00:00.000Z";
const CREATED = "2026-01-05T09:00:00.000Z";

/** Stored-only fields that are never returned to clients. */
export interface StoredInspection extends Inspection {
  idempotencyKey: string;
}
export interface StoredPhoto extends InspectionPhoto {
  /** Private object-storage path; never exposed in responses. */
  storagePath: string;
}

export interface FixtureData {
  profiles: Profile[];
  customers: Customer[];
  sites: Site[];
  systems: SolarSystem[];
  components: Component[];
  plans: MaintenancePlan[];
  jobs: MaintenanceJob[];
  inspections: StoredInspection[];
  photos: StoredPhoto[];
  reports: ServiceReport[];
  checklistTemplate: ChecklistTemplate;
}

// ---------- People ----------

export const COORDINATOR_ID = id("profile", 1);
export const TECHNICIAN_1_ID = id("profile", 2);
export const TECHNICIAN_2_ID = id("profile", 3);
export const INACTIVE_TECHNICIAN_ID = id("profile", 4);

const profiles: Profile[] = [
  { id: COORDINATOR_ID, displayName: "Maya Khoury", email: "maya.coordinator@example.com", role: "coordinator", active: true },
  { id: TECHNICIAN_1_ID, displayName: "Omar Saleh", email: "omar.technician@example.com", role: "technician", active: true },
  { id: TECHNICIAN_2_ID, displayName: "Hadi Nasr", email: "hadi.technician@example.com", role: "technician", active: true },
  { id: INACTIVE_TECHNICIAN_ID, displayName: "Rami Aoun", email: "rami.former@example.com", role: "technician", active: false },
];

// ---------- Registry ----------

const customer = (n: number, displayName: string, contactEmail: string | null, contactPhone: string | null): Customer => ({
  id: id("customer", n),
  displayName,
  contactEmail,
  contactPhone,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const customers: Customer[] = [
  customer(1, "Cedar Ridge Apartments", "facilities@cedar-ridge.example.com", "+961 00 000 101"),
  customer(2, "Byblos Family Farm", "owner@byblos-farm.example.com", "+961 00 000 102"),
  customer(3, "Harbor View Clinic", "admin@harbor-clinic.example.com", null),
  customer(4, "Olive Grove School", null, "+961 00 000 104"),
  // No sites yet: exercises empty states.
  customer(5, "Summit Bakery", "hello@summit-bakery.example.com", null),
];

const site = (n: number, customerN: number, label: string, addressLine1: string, city: string): Site => ({
  id: id("site", n),
  customerId: id("customer", customerN),
  label,
  addressLine1,
  addressLine2: null,
  city,
  region: null,
  postalCode: null,
  country: "LB",
  notes: null,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const sites: Site[] = [
  site(1, 1, "Building A roof", "12 Example Street", "Beirut"),
  site(2, 1, "Building B roof", "14 Example Street", "Beirut"),
  site(3, 2, "Barn roof", "Farm Road 3", "Byblos"),
  site(4, 2, "Pump house", "Farm Road 3", "Byblos"),
  site(5, 3, "Main clinic roof", "8 Harbor Lane", "Batroun"),
  site(6, 4, "Gymnasium roof", "1 School Avenue", "Zahle"),
  site(7, 4, "Classroom block", "1 School Avenue", "Zahle"),
];

const system = (n: number, siteN: number, label: string, capacityKw: number, installedOn: IsoDate): SolarSystem => ({
  id: id("system", n),
  siteId: id("site", siteN),
  label,
  capacityKw,
  installedOn,
  active: true,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const systems: SolarSystem[] = [
  system(1, 1, "Rooftop array A", 25.5, "2023-04-12"),
  system(2, 2, "Rooftop array B", 18, "2023-05-03"),
  system(3, 3, "Barn array", 12.6, "2022-09-20"),
  system(4, 4, "Pump system", 5.4, "2024-02-14"),
  system(5, 5, "Clinic main array", 30, "2021-11-08"),
  system(6, 5, "Clinic backup storage", 8, "2024-06-01"),
  system(7, 6, "Gym array", 40.32, "2023-08-21"),
  system(8, 7, "Classroom array", 15, "2025-03-10"),
];

const component = (
  n: number,
  systemN: number,
  type: ComponentType,
  manufacturer: string,
  model: string,
  serialNumber: string,
  installedOn: IsoDate,
  warrantyExpiresOn: IsoDate | null,
  extra: Partial<Pick<Component, "status" | "replacedComponentId">> = {},
): Component => ({
  id: id("component", n),
  systemId: id("system", systemN),
  type,
  manufacturer,
  model,
  serialNumber,
  installedOn,
  warrantyExpiresOn,
  status: extra.status ?? "active",
  replacedComponentId: extra.replacedComponentId ?? null,
  createdAt: CREATED,
  updatedAt: CREATED,
});

// Fictional manufacturers only.
const components: Component[] = [
  component(1, 1, "inverter", "Helion Power", "HP-20K", "HP20K-0001", "2023-04-12", "2033-04-12"),
  component(2, 1, "panel", "Lumen Cells", "LC-450 x56", "LC450-A-0001", "2023-04-12", "2048-04-12"),
  // Warranty ends inside the 90-day window: shows on the dashboard.
  component(3, 1, "battery", "VoltCore", "VC-10", "VC10-0001", "2023-04-12", "2026-12-31"),
  component(4, 2, "inverter", "Helion Power", "HP-15K", "HP15K-0002", "2023-05-03", "2033-05-03"),
  component(5, 2, "panel", "Lumen Cells", "LC-450 x40", "LC450-B-0002", "2023-05-03", "2048-05-03"),
  component(6, 3, "inverter", "Helion Power", "HP-10K", "HP10K-0003", "2022-09-20", "2027-01-15"),
  component(7, 3, "panel", "Lumen Cells", "LC-420 x30", "LC420-C-0003", "2022-09-20", "2047-09-20"),
  component(8, 4, "inverter", "Helion Power", "HP-5K", "HP5K-0004", "2024-02-14", "2034-02-14"),
  component(9, 4, "battery", "VoltCore", "VC-5", "VC5-0004", "2024-02-14", "2029-02-14"),
  // Replacement history: component 10 was replaced by component 11 (never overwritten).
  component(10, 5, "inverter", "Helion Power", "HP-25K", "HP25K-0005", "2021-11-08", "2031-11-08", { status: "replaced" }),
  component(11, 5, "inverter", "Helion Power", "HP-30K", "HP30K-0011", "2025-06-15", "2035-06-15", { replacedComponentId: id("component", 10) }),
  component(12, 5, "panel", "Lumen Cells", "LC-450 x66", "LC450-D-0005", "2021-11-08", "2046-11-08"),
  component(13, 6, "battery", "VoltCore", "VC-10", "VC10-0006", "2024-06-01", "2034-06-01"),
  component(14, 6, "other", "Helion Power", "HG-1 monitoring gateway", "HG1-0006", "2024-06-01", null),
  component(15, 7, "inverter", "Helion Power", "HP-40K", "HP40K-0007", "2023-08-21", "2027-02-10"),
  component(16, 7, "panel", "Lumen Cells", "LC-480 x84", "LC480-E-0007", "2023-08-21", "2048-08-21"),
  component(17, 8, "inverter", "Helion Power", "HP-15K", "HP15K-0008", "2025-03-10", "2035-03-10"),
  component(18, 8, "panel", "Lumen Cells", "LC-450 x33", "LC450-F-0008", "2025-03-10", "2050-03-10"),
];

// ---------- Maintenance ----------

const plan = (n: number, systemN: number, intervalMonths: number, anchorDate: IsoDate, status: MaintenancePlan["status"]): MaintenancePlan => ({
  id: id("plan", n),
  systemId: id("system", systemN),
  intervalMonths,
  anchorDate,
  timezone: "Asia/Beirut",
  status,
  revision: 1,
  version: 1,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const plans: MaintenancePlan[] = [
  plan(1, 1, 1, "2026-01-31", "active"), // month-end clamp case
  plan(2, 3, 3, "2026-03-15", "active"),
  plan(3, 5, 6, "2026-06-01", "paused"),
  plan(4, 7, 12, "2025-11-25", "active"),
  plan(5, 2, 1, "2026-02-20", "active"), // has an occurrence exactly on FIXTURE_TODAY
];

const job = (
  n: number,
  planN: number,
  systemN: number,
  scheduledDate: IsoDate,
  status: MaintenanceJob["status"],
  technicianId: string | null,
  extra: Partial<Pick<MaintenanceJob, "lastChangeReason" | "completedAt" | "version">> = {},
): MaintenanceJob => ({
  id: id("job", n),
  planId: id("plan", planN),
  systemId: id("system", systemN),
  scheduledDate,
  technicianId,
  status,
  version: extra.version ?? 1,
  lastChangeReason: extra.lastChangeReason ?? null,
  completedAt: extra.completedAt ?? null,
  createdAt: CREATED,
  updatedAt: CREATED,
});

/**
 * Seeded jobs sit on real plan occurrences. Deliberately missing: plan 1 on 2027-01-31 and plan 5 on
 * 2027-01-20, so a mock generation run inserts exactly 2 and skips 6.
 */
const jobs: MaintenanceJob[] = [
  job(1, 1, 1, "2026-10-31", "completed", TECHNICIAN_1_ID, { completedAt: "2026-10-31T11:45:00.000Z", version: 4 }),
  job(2, 1, 1, "2026-11-30", "assigned", TECHNICIAN_1_ID, { version: 2 }),
  job(3, 1, 1, "2026-12-31", "scheduled", null),
  job(4, 2, 3, "2026-09-15", "cancelled", null, { lastChangeReason: "Customer asked to skip this visit", version: 2 }),
  job(5, 2, 3, "2026-12-15", "assigned", TECHNICIAN_2_ID, { version: 2 }),
  job(6, 4, 7, "2026-11-25", "scheduled", null),
  job(7, 5, 2, "2026-11-20", "in_progress", TECHNICIAN_1_ID, { version: 3 }),
  job(8, 5, 2, "2026-12-20", "scheduled", null),
  job(9, 5, 2, "2026-10-20", "assigned", TECHNICIAN_2_ID, { version: 2 }), // overdue
];

// ---------- Inspections and reports ----------

/** PLACEHOLDER content until PC-S1-04 (Tarek) delivers the technician checklist map; the shape is fixed. */
export const CHECKLIST_TEMPLATE_V1: ChecklistTemplate = {
  version: 1,
  title: "Routine solar maintenance visit",
  items: [
    { id: "safety_isolation", label: "AC and DC isolators tested and locked out before work", kind: "boolean", required: true },
    { id: "panel_condition", label: "Panel surface condition", kind: "choice", required: true, options: ["good", "minor soiling", "damage found"] },
    { id: "mounting_secure", label: "Mounting and fixings secure", kind: "boolean", required: true },
    { id: "inverter_no_faults", label: "Inverter shows no active faults", kind: "boolean", required: true },
    { id: "dc_voltage", label: "String DC voltage", kind: "number", unit: "V", min: 0, max: 1500, required: true },
    { id: "ac_output", label: "AC output at time of visit", kind: "number", unit: "kW", min: 0, max: 1000, required: true },
    { id: "battery_soc", label: "Battery state of charge", kind: "number", unit: "%", min: 0, max: 100, required: false, helpText: "Only if the system has a battery." },
    { id: "cleaning_done", label: "Panel cleaning performed", kind: "choice", required: true, options: ["none", "partial", "full"] },
    { id: "observations", label: "Other observations", kind: "text", required: false },
  ],
};

const confirmation = { typedName: "Facilities Manager (demo)", acknowledged: true as const, confirmedAt: "2026-10-31T11:40:00.000Z" };
const answers = {
  safety_isolation: true,
  panel_condition: "minor soiling",
  mounting_secure: true,
  inverter_no_faults: true,
  dc_voltage: 612.4,
  ac_output: 17.8,
  battery_soc: 84,
  cleaning_done: "full",
};

const inspections: StoredInspection[] = [
  {
    id: id("inspection", 1),
    jobId: id("job", 1),
    checklistVersion: 1,
    answers,
    notes: "Light dust on the north rows, cleaned.",
    confirmation,
    submittedAt: "2026-10-31T11:45:00.000Z",
    idempotencyKey: "0000000b-0000-4000-8000-000000000001",
  },
];

const photos: StoredPhoto[] = [
  {
    id: id("photo", 1),
    jobId: id("job", 1),
    caption: "Array after cleaning (no real image in S1)",
    mimeType: "image/jpeg",
    sizeBytes: 812_000,
    url: null,
    uploadedAt: "2026-10-31T11:30:00.000Z",
    storagePath: "inspections/00000007-0000-4000-8000-000000000001/00000010-0000-4000-8000-000000000001.jpg",
  },
];

const reports: ServiceReport[] = [
  {
    id: id("report", 1),
    jobId: id("job", 1),
    inspectionId: id("inspection", 1),
    generatedAt: "2026-10-31T11:45:00.000Z",
    snapshot: {
      customer: { id: id("customer", 1), displayName: "Cedar Ridge Apartments" },
      site: { id: id("site", 1), label: "Building A roof", address: "12 Example Street, Beirut, LB" },
      system: { id: id("system", 1), label: "Rooftop array A", capacityKw: 25.5 },
      components: [
        { id: id("component", 1), type: "inverter", manufacturer: "Helion Power", model: "HP-20K", serialNumber: "HP20K-0001" },
        { id: id("component", 2), type: "panel", manufacturer: "Lumen Cells", model: "LC-450 x56", serialNumber: "LC450-A-0001" },
        { id: id("component", 3), type: "battery", manufacturer: "VoltCore", model: "VC-10", serialNumber: "VC10-0001" },
      ],
      job: { id: id("job", 1), scheduledDate: "2026-10-31", completedAt: "2026-10-31T11:45:00.000Z", technicianId: TECHNICIAN_1_ID, technicianName: "Omar Saleh" },
      checklist: {
        version: 1,
        title: CHECKLIST_TEMPLATE_V1.title,
        lines: CHECKLIST_TEMPLATE_V1.items.map((item) => ({
          itemId: item.id,
          label: item.label,
          kind: item.kind,
          unit: item.unit ?? null,
          value: answers[item.id as keyof typeof answers] ?? null,
        })),
      },
      notes: "Light dust on the north rows, cleaned.",
      photos: [{ id: id("photo", 1), caption: "Array after cleaning (no real image in S1)" }],
      confirmation,
    },
  },
];

/** A fresh, independent copy of the full demo data set. */
export function createFixtureData(): FixtureData {
  return structuredClone({
    profiles,
    customers,
    sites,
    systems,
    components,
    plans,
    jobs,
    inspections,
    photos,
    reports,
    checklistTemplate: CHECKLIST_TEMPLATE_V1,
  });
}

/** Same people and checklist, but no records: backs the "empty" mock scenario. */
export function createEmptyFixtureData(): FixtureData {
  return structuredClone({
    profiles,
    customers: [],
    sites: [],
    systems: [],
    components: [],
    plans: [],
    jobs: [],
    inspections: [],
    photos: [],
    reports: [],
    checklistTemplate: CHECKLIST_TEMPLATE_V1,
  });
}

/** Demo sign-in accounts for the clearly-labelled mock login (PC-S1-05). Any non-empty password works. */
export const DEMO_ACCOUNTS = profiles
  .filter((profile) => profile.active)
  .map(({ id: profileId, displayName, email, role }) => ({ id: profileId, displayName, email, role }));
