/** MOCK registry adapter (customers, sites, systems, components). In-memory only; nothing persists. */
import type { Component, CustomerListItem, RegistryAdapter, Site, SolarSystem, SystemDetail, SystemListItem } from "../../../types";
import type { FixtureData } from "../../fixtures/data";
import {
  createComponentSchema,
  createCustomerSchema,
  createSiteSchema,
  createSystemSchema,
  customerListQuerySchema,
  parseRequest,
  systemListQuerySchema,
} from "../../validations";
import { canViewJob } from "../../validations/job-status";
import { COORDINATOR_ONLY, failure, fromError, matchesText, nowIso, paginate, simulate, success, type MockContext } from "../mock/runtime";

function serialTaken(store: FixtureData, serial: string): boolean {
  const key = serial.trim().toLowerCase();
  return store.components.some((component) => component.serialNumber.toLowerCase() === key);
}

function newestFirst(a: Component, b: Component): number {
  return b.installedOn.localeCompare(a.installedOn) || b.createdAt.localeCompare(a.createdAt);
}

function systemDetail(store: FixtureData, system: SolarSystem): SystemDetail | null {
  const site = store.sites.find((item) => item.id === system.siteId);
  const customer = site && store.customers.find((item) => item.id === site.customerId);
  if (!site || !customer) return null;
  return {
    ...system,
    site,
    customer: { id: customer.id, displayName: customer.displayName },
    components: store.components.filter((item) => item.systemId === system.id).sort(newestFirst),
    plans: store.plans.filter((item) => item.systemId === system.id),
  };
}

function systemListItem(store: FixtureData, system: SolarSystem): SystemListItem {
  const site = store.sites.find((item) => item.id === system.siteId);
  const customer = site && store.customers.find((item) => item.id === site.customerId);
  const active = store.components.filter((item) => item.systemId === system.id && item.status === "active");
  const expiries = active.map((item) => item.warrantyExpiresOn).filter((value): value is string => value !== null).sort();
  return {
    ...system,
    siteLabel: site?.label ?? "Unknown site",
    customerId: customer?.id ?? "",
    customerName: customer?.displayName ?? "Unknown customer",
    activeComponentCount: active.length,
    nextWarrantyExpiry: expiries[0] ?? null,
  };
}

export function createMockRegistryAdapter(ctx: MockContext): RegistryAdapter {
  return {
    source: "mock",

    listCustomers: (query = {}) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(customerListQuerySchema, query);
        if (!parsed.ok) return fromError(parsed.error);
        const { q, sort = "displayName", sortDirection = "asc", page, pageSize } = parsed.data;
        const items: CustomerListItem[] = ctx.store.customers
          .filter((customer) => matchesText(q, customer.displayName, customer.contactEmail))
          .map((customer) => {
            const siteIds = new Set(ctx.store.sites.filter((site) => site.customerId === customer.id).map((site) => site.id));
            return {
              ...customer,
              siteCount: siteIds.size,
              systemCount: ctx.store.systems.filter((system) => siteIds.has(system.siteId)).length,
            };
          })
          .sort((a, b) => (sortDirection === "asc" ? 1 : -1) * a[sort].localeCompare(b[sort]));
        return success(paginate(items, page, pageSize));
      }),

    getCustomer: (id) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const customer = ctx.store.customers.find((item) => item.id === id);
        if (!customer) return failure("NOT_FOUND", "Customer not found.");
        const sites = ctx.store.sites
          .filter((site) => site.customerId === id)
          .map((site) => ({ ...site, systems: ctx.store.systems.filter((system) => system.siteId === site.id) }));
        return success({ ...customer, sites });
      }),

    createCustomer: (request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(createCustomerSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const at = nowIso(ctx);
        const customer = {
          id: ctx.newId(),
          displayName: parsed.data.displayName,
          contactEmail: parsed.data.contactEmail ?? null,
          contactPhone: parsed.data.contactPhone ?? null,
          createdAt: at,
          updatedAt: at,
        };
        ctx.store.customers.push(customer);
        return success(customer, 201);
      }),

    createSite: (request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(createSiteSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        if (!ctx.store.customers.some((customer) => customer.id === parsed.data.customerId)) {
          return failure("VALIDATION_FAILED", "Some fields need attention.", { customerId: ["Customer not found."] });
        }
        const at = nowIso(ctx);
        const { addressLine2, region, postalCode, notes, ...rest } = parsed.data;
        const site: Site = {
          ...rest,
          id: ctx.newId(),
          addressLine2: addressLine2 ?? null,
          region: region ?? null,
          postalCode: postalCode ?? null,
          notes: notes ?? null,
          createdAt: at,
          updatedAt: at,
        };
        ctx.store.sites.push(site);
        return success(site, 201);
      }),

    listSystems: (query = {}) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(systemListQuerySchema, query);
        if (!parsed.ok) return fromError(parsed.error);
        const { q, customerId, siteId, sortDirection = "asc", page, pageSize } = parsed.data;
        const items = ctx.store.systems
          .map((system) => systemListItem(ctx.store, system))
          .filter((item) => (!customerId || item.customerId === customerId) && (!siteId || item.siteId === siteId))
          .filter((item) => {
            const serials = ctx.store.components.filter((c) => c.systemId === item.id).map((c) => c.serialNumber);
            return matchesText(q, item.label, item.customerName, ...serials);
          })
          .sort((a, b) => (sortDirection === "asc" ? 1 : -1) * a.label.localeCompare(b.label));
        return success(paginate(items, page, pageSize));
      }),

    // Technicians may read a system only while they hold a non-cancelled job on it (contract: "assigned-only").
    getSystem: (id) =>
      simulate(ctx, {}, (session) => {
        const system = ctx.store.systems.find((item) => item.id === id);
        if (!system) return failure("NOT_FOUND", "System not found.");
        if (session.role === "technician") {
          const hasJob = ctx.store.jobs.some((job) => job.systemId === id && job.status !== "cancelled" && canViewJob(session, job));
          if (!hasJob) return failure("NOT_FOUND", "System not found.");
        }
        const detail = systemDetail(ctx.store, system);
        return detail ? success(detail) : failure("NOT_FOUND", "System not found.");
      }),

    createSystem: (request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(createSystemSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        if (!ctx.store.sites.some((site) => site.id === parsed.data.siteId)) {
          return failure("VALIDATION_FAILED", "Some fields need attention.", { siteId: ["Site not found."] });
        }
        const duplicates: Record<string, string[]> = {};
        parsed.data.components.forEach((component, index) => {
          if (serialTaken(ctx.store, component.serialNumber)) {
            duplicates[`components.${index}.serialNumber`] = ["This serial number is already registered."];
          }
        });
        if (Object.keys(duplicates).length) return failure("CONFLICT", "A serial number is already registered.", duplicates);

        const at = nowIso(ctx);
        const system: SolarSystem = {
          id: ctx.newId(),
          siteId: parsed.data.siteId,
          label: parsed.data.label,
          capacityKw: parsed.data.capacityKw,
          installedOn: parsed.data.installedOn,
          active: true,
          createdAt: at,
          updatedAt: at,
        };
        ctx.store.systems.push(system);
        for (const input of parsed.data.components) {
          ctx.store.components.push({
            ...input,
            id: ctx.newId(),
            systemId: system.id,
            warrantyExpiresOn: input.warrantyExpiresOn ?? null,
            status: "active",
            replacedComponentId: null,
            createdAt: at,
            updatedAt: at,
          });
        }
        const detail = systemDetail(ctx.store, system);
        return detail ? success(detail, 201) : failure("INTERNAL", "System was saved but could not be loaded.");
      }),

    createComponent: (request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(createComponentSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const { systemId, replacesComponentId, ...input } = parsed.data;
        if (!ctx.store.systems.some((system) => system.id === systemId)) {
          return failure("VALIDATION_FAILED", "Some fields need attention.", { systemId: ["System not found."] });
        }
        if (serialTaken(ctx.store, input.serialNumber)) {
          return failure("CONFLICT", "This serial number is already registered.", { serialNumber: ["This serial number is already registered."] });
        }
        let replaced: Component | undefined;
        if (replacesComponentId) {
          replaced = ctx.store.components.find((component) => component.id === replacesComponentId);
          if (!replaced || replaced.systemId !== systemId) {
            return failure("VALIDATION_FAILED", "Some fields need attention.", { replacesComponentId: ["Component not found on this system."] });
          }
          if (replaced.status !== "active") {
            return failure("CONFLICT", "Only an active component can be replaced.", { replacesComponentId: ["Already replaced or retired."] });
          }
        }
        const at = nowIso(ctx);
        // Replacement keeps history: the old row is marked "replaced", never edited away.
        if (replaced) {
          replaced.status = "replaced";
          replaced.updatedAt = at;
        }
        const component: Component = {
          ...input,
          id: ctx.newId(),
          systemId,
          warrantyExpiresOn: input.warrantyExpiresOn ?? null,
          status: "active",
          replacedComponentId: replaced?.id ?? null,
          createdAt: at,
          updatedAt: at,
        };
        ctx.store.components.push(component);
        return success(component, 201);
      }),
  };
}
