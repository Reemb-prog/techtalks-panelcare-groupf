import type { IsoDate, IsoDateTime, ListQuery, Uuid } from "./common";
import type { MaintenancePlan } from "./maintenance";

// ---------- Entities ----------

export interface Customer {
  id: Uuid;
  displayName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Site {
  id: Uuid;
  customerId: Uuid;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  /** ISO 3166-1 alpha-2, e.g. "LB". */
  country: string;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface SolarSystem {
  id: Uuid;
  siteId: Uuid;
  label: string;
  /** Kilowatts peak, > 0, at most 3 decimals. DECIMAL in the database, number on the wire. */
  capacityKw: number;
  installedOn: IsoDate;
  active: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export const COMPONENT_TYPES = ["inverter", "battery", "panel", "other"] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const COMPONENT_STATUSES = ["active", "replaced", "retired"] as const;
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

/**
 * A physical component. Replacement never overwrites: the old row becomes status "replaced"
 * and the new row points back to it through replacedComponentId.
 */
export interface Component {
  id: Uuid;
  systemId: Uuid;
  type: ComponentType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installedOn: IsoDate;
  warrantyExpiresOn: IsoDate | null;
  status: ComponentStatus;
  /** The component this one replaced, if any. */
  replacedComponentId: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

// ---------- Requests ----------

export interface CreateCustomerRequest {
  displayName: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateSiteRequest {
  customerId: Uuid;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  notes?: string;
}

/** Component fields when registered together with a new system (systemId comes from the parent). */
export interface ComponentInput {
  type: ComponentType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installedOn: IsoDate;
  warrantyExpiresOn?: IsoDate;
}

export interface CreateSystemRequest {
  siteId: Uuid;
  label: string;
  capacityKw: number;
  installedOn: IsoDate;
  components: ComponentInput[];
}

/** Add a component to an existing system, or replace one when replacesComponentId is set. */
export interface CreateComponentRequest extends ComponentInput {
  systemId: Uuid;
  replacesComponentId?: Uuid;
}

export type CustomerSort = "displayName" | "createdAt";

/** GET /api/customers. q matches displayName and contactEmail. */
export interface CustomerListQuery extends ListQuery {
  sort?: CustomerSort;
}

/** GET /api/systems. q matches system label, serial numbers and customer name. */
export interface SystemListQuery extends ListQuery {
  customerId?: Uuid;
  siteId?: Uuid;
}

// ---------- Responses ----------

export interface CustomerListItem extends Customer {
  siteCount: number;
  systemCount: number;
}

export interface SiteWithSystems extends Site {
  systems: SolarSystem[];
}

/** GET /api/customers/:id */
export interface CustomerDetail extends Customer {
  sites: SiteWithSystems[];
}

export interface SystemListItem extends SolarSystem {
  siteLabel: string;
  customerId: Uuid;
  customerName: string;
  activeComponentCount: number;
  /** Earliest warranty expiry among active components, or null. */
  nextWarrantyExpiry: IsoDate | null;
}

/** GET /api/systems/:id */
export interface SystemDetail extends SolarSystem {
  site: Site;
  customer: Pick<Customer, "id" | "displayName">;
  /** All components including replaced/retired history, newest first. */
  components: Component[];
  plans: MaintenancePlan[];
}
