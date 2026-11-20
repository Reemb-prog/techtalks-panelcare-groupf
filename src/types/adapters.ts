/**
 * Adapter interfaces. S1 mocks and S2 real (fetch-based) adapters implement exactly these,
 * so screens never change when the data source is swapped. Each method maps to one REST route.
 */
import type { Profile, Session, SignInRequest, TechnicianSummary } from "./auth";
import type { Paginated, Uuid } from "./common";
import type { DashboardStats } from "./dashboard";
import type { JobListItem, JobListQuery, JobPatchRequest } from "./dispatch";
import type { ApiResult } from "./errors";
import type {
  ChecklistTemplate,
  CompleteJobRequest,
  InspectionPhoto,
  RegisterPhotoRequest,
  ServiceReport,
} from "./inspections";
import type {
  CreatePlanRequest,
  GenerateJobsRequest,
  GenerationRunResult,
  MaintenancePlan,
  PlanListItem,
  PlanListQuery,
  UpdatePlanRequest,
} from "./maintenance";
import type {
  Component,
  CreateComponentRequest,
  CreateCustomerRequest,
  CreateSiteRequest,
  CreateSystemRequest,
  Customer,
  CustomerDetail,
  CustomerListItem,
  CustomerListQuery,
  Site,
  SystemDetail,
  SystemListItem,
  SystemListQuery,
} from "./registry";

export type AdapterSource = "mock" | "api";

export interface AdapterBase {
  /** "mock" means nothing is persisted and no authorization is enforced for real. */
  readonly source: AdapterSource;
}

export interface AuthAdapter extends AdapterBase {
  /** Current session, or null data when signed out. */
  getSession(): Promise<ApiResult<Session | null>>;
  signIn(request: SignInRequest): Promise<ApiResult<Session>>;
  signOut(): Promise<ApiResult<null>>;
  getProfile(): Promise<ApiResult<Profile>>;
}

export interface RegistryAdapter extends AdapterBase {
  listCustomers(query?: CustomerListQuery): Promise<ApiResult<Paginated<CustomerListItem>>>;
  getCustomer(id: Uuid): Promise<ApiResult<CustomerDetail>>;
  createCustomer(request: CreateCustomerRequest): Promise<ApiResult<Customer>>;
  createSite(request: CreateSiteRequest): Promise<ApiResult<Site>>;
  listSystems(query?: SystemListQuery): Promise<ApiResult<Paginated<SystemListItem>>>;
  getSystem(id: Uuid): Promise<ApiResult<SystemDetail>>;
  createSystem(request: CreateSystemRequest): Promise<ApiResult<SystemDetail>>;
  createComponent(request: CreateComponentRequest): Promise<ApiResult<Component>>;
}

export interface MaintenanceAdapter extends AdapterBase {
  listPlans(query?: PlanListQuery): Promise<ApiResult<Paginated<PlanListItem>>>;
  getPlan(id: Uuid): Promise<ApiResult<MaintenancePlan>>;
  createPlan(request: CreatePlanRequest): Promise<ApiResult<MaintenancePlan>>;
  updatePlan(id: Uuid, request: UpdatePlanRequest): Promise<ApiResult<MaintenancePlan>>;
  generateJobs(request?: GenerateJobsRequest): Promise<ApiResult<GenerationRunResult>>;
}

export interface DispatchAdapter extends AdapterBase {
  listJobs(query?: JobListQuery): Promise<ApiResult<Paginated<JobListItem>>>;
  getJob(id: Uuid): Promise<ApiResult<JobListItem>>;
  updateJob(id: Uuid, request: JobPatchRequest): Promise<ApiResult<JobListItem>>;
  listTechnicians(): Promise<ApiResult<TechnicianSummary[]>>;
}

export interface InspectionsAdapter extends AdapterBase {
  getChecklistTemplate(): Promise<ApiResult<ChecklistTemplate>>;
  registerPhoto(request: RegisterPhotoRequest): Promise<ApiResult<InspectionPhoto>>;
  completeJob(jobId: Uuid, request: CompleteJobRequest): Promise<ApiResult<ServiceReport>>;
  getReport(id: Uuid): Promise<ApiResult<ServiceReport>>;
}

export interface DashboardAdapter extends AdapterBase {
  getStats(): Promise<ApiResult<DashboardStats>>;
}

export interface Adapters {
  auth: AuthAdapter;
  registry: RegistryAdapter;
  maintenance: MaintenanceAdapter;
  dispatch: DispatchAdapter;
  inspections: InspectionsAdapter;
  dashboard: DashboardAdapter;
}
