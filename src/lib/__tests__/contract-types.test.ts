/**
 * Compile-time guard: Zod schemas and hand-written DTO types must describe exactly the same shapes.
 * Checked by `npm run typecheck`; a drift fails the build, not just this test.
 */
import { describe, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import type {
  CompleteJobRequest,
  ComponentInput,
  CreateComponentRequest,
  CreateCustomerRequest,
  CreatePlanRequest,
  CreateSiteRequest,
  CreateSystemRequest,
  CustomerListQuery,
  GenerateJobsRequest,
  JobListQuery,
  JobPatchRequest,
  PlanListQuery,
  RegisterPhotoRequest,
  SystemListQuery,
  UpdatePlanRequest,
} from "../../types";
import type * as v from "../validations";

describe("Zod schemas match the DTO types", () => {
  it("registry", () => {
    expectTypeOf<z.output<typeof v.createCustomerSchema>>().toEqualTypeOf<CreateCustomerRequest>();
    expectTypeOf<z.output<typeof v.createSiteSchema>>().toEqualTypeOf<CreateSiteRequest>();
    expectTypeOf<z.output<typeof v.componentInputSchema>>().toEqualTypeOf<ComponentInput>();
    expectTypeOf<z.output<typeof v.createSystemSchema>>().toEqualTypeOf<CreateSystemRequest>();
    expectTypeOf<z.output<typeof v.createComponentSchema>>().toEqualTypeOf<CreateComponentRequest>();
    expectTypeOf<z.output<typeof v.customerListQuerySchema>>().toEqualTypeOf<CustomerListQuery>();
    expectTypeOf<z.output<typeof v.systemListQuerySchema>>().toEqualTypeOf<SystemListQuery>();
  });

  it("maintenance and dispatch", () => {
    expectTypeOf<z.output<typeof v.createPlanSchema>>().toEqualTypeOf<CreatePlanRequest>();
    expectTypeOf<z.output<typeof v.updatePlanSchema>>().toEqualTypeOf<UpdatePlanRequest>();
    expectTypeOf<z.output<typeof v.planListQuerySchema>>().toEqualTypeOf<PlanListQuery>();
    expectTypeOf<z.output<typeof v.generateJobsSchema>>().toEqualTypeOf<GenerateJobsRequest>();
    expectTypeOf<z.output<typeof v.jobPatchSchema>>().toEqualTypeOf<JobPatchRequest>();
    expectTypeOf<z.output<typeof v.jobListQuerySchema>>().toEqualTypeOf<JobListQuery>();
  });

  it("inspections", () => {
    expectTypeOf<z.output<typeof v.registerPhotoSchema>>().toEqualTypeOf<RegisterPhotoRequest>();
    expectTypeOf<z.output<typeof v.completeJobSchema>>().toEqualTypeOf<CompleteJobRequest>();
  });
});
