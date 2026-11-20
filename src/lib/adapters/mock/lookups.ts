/** Read-model joins over the mock store, mirroring the joined DTOs the S2 API returns. */
import type { JobListItem, MaintenanceJob } from "../../../types";
import type { FixtureData } from "../../fixtures/data";

export function systemContext(store: FixtureData, systemId: string) {
  const system = store.systems.find((item) => item.id === systemId);
  const site = system && store.sites.find((item) => item.id === system.siteId);
  const customer = site && store.customers.find((item) => item.id === site.customerId);
  return { system, site, customer };
}

export function profileName(store: FixtureData, profileId: string | null): string | null {
  if (!profileId) return null;
  return store.profiles.find((profile) => profile.id === profileId)?.displayName ?? null;
}

export function toJobListItem(store: FixtureData, job: MaintenanceJob): JobListItem {
  const { system, site, customer } = systemContext(store, job.systemId);
  return {
    ...job,
    systemLabel: system?.label ?? "Unknown system",
    siteLabel: site?.label ?? "Unknown site",
    city: site?.city ?? "",
    customerName: customer?.displayName ?? "Unknown customer",
    technicianName: profileName(store, job.technicianId),
    reportId: store.reports.find((report) => report.jobId === job.id)?.id ?? null,
  };
}
