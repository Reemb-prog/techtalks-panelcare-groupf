"use client";

import Link from "next/link";
import { ContentSkeleton } from "@/components/layout/loading-skeleton";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { RegistryForm, type Field } from "@/components/registry/registry-form";
import css from "@/components/registry/registry.module.css";
import { createComponentSchema, createCustomerSchema, createSiteSchema, createSystemSchema } from "@/lib/validations/registry";
import { COMPONENT_TYPES, type ApiResult, type Component, type CustomerDetail, type Paginated, type SiteWithSystems, type SystemDetail } from "@/types";

type Area = "customers" | "systems";
const customerFields: Field[] = [
  { name: "displayName", label: "Customer name" },
  { name: "contactEmail", label: "Email", type: "email", optional: true },
  { name: "contactPhone", label: "Phone", type: "tel", optional: true },
];
const siteFields: Field[] = [
  { name: "label", label: "Site name" }, { name: "addressLine1", label: "Street address" },
  { name: "addressLine2", label: "Address line 2", optional: true }, { name: "city", label: "City" },
  { name: "region", label: "Region", optional: true }, { name: "postalCode", label: "Postal code", optional: true },
  { name: "country", label: "Two-letter country code" }, { name: "notes", label: "Site notes", optional: true },
];
const systemFields: Field[] = [
  { name: "label", label: "System name" }, { name: "capacityKw", label: "Capacity (kWp)", type: "number" },
  { name: "installedOn", label: "Install date", type: "date" },
];
const componentFields: Field[] = [
  { name: "type", label: "Component type", options: COMPONENT_TYPES }, { name: "manufacturer", label: "Manufacturer" },
  { name: "model", label: "Model" }, { name: "serialNumber", label: "Serial number" },
  { name: "installedOn", label: "Install date", type: "date" },
  { name: "warrantyExpiresOn", label: "Warranty expiry", type: "date", optional: true },
];

function Action({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return <Link className={primary ? css.primary : css.secondary} href={href}>{children}</Link>;
}

function Screen({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <div className={css.screen}>
    <header className={css.top}>
      <div><h1>{title}</h1>{subtitle && <p className={css.muted}>{subtitle}</p>}</div>
      {action}
    </header>
    {children}
  </div>;
}

function Card({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return <Link className={css.card} href={href}><h2>{title}</h2>{children}</Link>;
}

function Query<T>({ load, layout = "detail", children }: { load: () => Promise<ApiResult<T>>; layout?: "cards" | "detail"; children: (data: T) => ReactNode }) {
  const { dataVersion } = useAdapters();
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{ load: typeof load; version: number; retry: number; result: ApiResult<T> } | null>(null);
  useEffect(() => {
    let active = true;
    const publish = (result: ApiResult<T>) => {
      if (active) setResponse({ load, version: dataVersion, retry, result });
    };
    void load().then(publish).catch(() => publish({ ok: false, status: 500, error: { code: "INTERNAL", message: "The mock request failed." } }));
    return () => { active = false; };
  }, [load, dataVersion, retry]);

  if (response?.load !== load || response.version !== dataVersion || response.retry !== retry) {
    return <ContentSkeleton label="Loading registry records…" layout={layout} />;
  }
  const { result } = response;
  if (result.ok) return children(result.data);
  const denied = result.status === 403 || result.status === 401;
  return <section className={css.panel}>
    <h2>{denied ? "Permission denied" : result.status === 404 ? "Record unavailable" : "Could not load registry"}</h2>
    <p role="alert">{result.error.message}</p>
    {result.status >= 500 && <button className={css.secondary} onClick={() => setRetry(retry + 1)}>Retry</button>}
    <Action href="/dashboard">Back to dashboard</Action>
  </section>;
}

function Missing({ href }: { href: string }) {
  return <Screen title="Record unavailable"><div className={css.panel}><p>This registry record could not be found.</p><Action href={href}>Back to registry</Action></div></Screen>;
}

function Results<T>({ data, page, setPage, query, clear, render }: {
  data: Paginated<T>; page: number; setPage: (page: number) => void; query: string; clear: () => void; render: (item: T) => ReactNode;
}) {
  return <>
    {data.items.length > 0 ? <div className={css.results}>{data.items.map(render)}</div> :
      <div className={css.panel}><h2>{query ? "No matching records" : "No records yet"}</h2>
        {query && <button className={css.secondary} onClick={clear}>Clear search</button>}
      </div>}
    <nav className={css.actions} aria-label="Result pages">
      <button className={css.secondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
      <p className={css.muted}>Page {page} · {data.total} records</p>
      <button className={css.secondary} disabled={page * 12 >= data.total} onClick={() => setPage(page + 1)}>Next</button>
    </nav>
  </>;
}

function ListScreen({ area }: { area: Area }) {
  const { adapters: { registry } } = useAdapters();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const customers = useCallback(() => registry.listCustomers({ q: query || undefined, page, pageSize: 12 }), [registry, query, page]);
  const systems = useCallback(() => registry.listSystems({ q: query || undefined, page, pageSize: 12 }), [registry, query, page]);
  function clear() { setInput(""); setQuery(""); setPage(1); }
  return <Screen title={area === "customers" ? "Customers" : "Solar systems"}
    subtitle={area === "customers" ? "Manage customer records and installation sites." : "Find installations, equipment, and warranty dates."}
    action={area === "customers" ? <Action href="/customers/new" primary>New customer</Action> : <Action href="/customers">Choose a site to add a system</Action>}>
    <form className={css.search} onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()); setPage(1); }}>
      <div><label htmlFor="registry-search">Search {area}</label><input id="registry-search" value={input} onChange={(event) => setInput(event.target.value)} /></div>
      <button className={css.primary}>Search</button>
    </form>
    {area === "customers" ? <Query load={customers} layout="cards">{data => <Results data={data} page={page} setPage={setPage} query={query} clear={clear}
      render={record => <Card key={record.id} href={"/customers/" + record.id} title={record.displayName}>
        <p className={css.muted}>{record.contactEmail ?? "No email recorded"}</p><p>{record.siteCount} sites · {record.systemCount} systems</p>
      </Card>} />}</Query> : <Query load={systems} layout="cards">{data => <Results data={data} page={page} setPage={setPage} query={query} clear={clear}
      render={record => <Card key={record.id} href={"/systems/" + record.id} title={record.label}>
        <p className={css.muted}>{record.customerName} · {record.siteLabel}</p><p>{record.capacityKw} kWp · {record.activeComponentCount} active components</p>
        <p>Next warranty expiry: {record.nextWarrantyExpiry ?? "Not recorded"}</p>
      </Card>} />}</Query>}
  </Screen>;
}

function NewCustomer() {
  const { adapters: { registry } } = useAdapters();
  const router = useRouter();
  return <Screen title="New customer" action={<Action href="/customers">Customers</Action>}>
    <RegistryForm fields={customerFields} schema={createCustomerSchema} save={registry.createCustomer}
      onSaved={(record) => router.push("/customers/" + record.id)} action="Create customer" />
  </Screen>;
}

function CustomerDetailScreen({ customer }: { customer: CustomerDetail }) {
  const base = "/customers/" + customer.id;
  return <Screen title={customer.displayName} subtitle={customer.contactEmail ?? "No email recorded"}
    action={<Action href={base + "/sites/new"} primary>Add site</Action>}>
    <Action href="/customers">All customers</Action>
    <section className={css.panel}><h2>Contact</h2><p>{customer.contactPhone ?? "No phone recorded"}</p></section>
    <section className={css.panel}><h2>Installation sites</h2>
      {customer.sites.length ? <div className={css.results}>{customer.sites.map(site => (
        <Card key={site.id} href={base + "/sites/" + site.id} title={site.label}><p>{site.city} · {site.systems.length} systems</p></Card>
      ))}</div> : <p>No sites yet.</p>}
    </section>
    <section className={css.panel}><h2>Linked solar systems</h2>
      {customer.sites.some(site => site.systems.length) ? <div className={css.results}>{customer.sites.flatMap(site => site.systems.map(system => (
        <Card key={system.id} href={"/systems/" + system.id} title={system.label}><p>{site.label} · {system.capacityKw} kWp</p></Card>
      )))}</div> : <p>No linked systems yet.</p>}
    </section>
  </Screen>;
}

function SiteDetail({ site, base }: { site: SiteWithSystems; base: string }) {
  return <Screen title={site.label} subtitle={[site.addressLine1, site.addressLine2, site.city, site.region, site.postalCode, site.country].filter(Boolean).join(", ")}
    action={<Action href={base + "/sites/" + site.id + "/systems/new"} primary>Register system</Action>}>
    <Action href={base}>Customer details</Action>
    {site.notes && <section className={css.panel}><h2>Site notes</h2><p>{site.notes}</p></section>}
    <section className={css.panel}><h2>Solar systems</h2>
      {site.systems.length ? <div className={css.results}>{site.systems.map(system => (
        <Card key={system.id} href={"/systems/" + system.id} title={system.label}><p>{system.capacityKw} kWp · Installed {system.installedOn}</p></Card>
      ))}</div> : <p>No systems registered at this site.</p>}
    </section>
  </Screen>;
}

function RegisterSystem({ site, customer }: { site: SiteWithSystems; customer: CustomerDetail }) {
  const { adapters: { registry } } = useAdapters();
  const router = useRouter();
  const [componentCount, setComponentCount] = useState(0);
  const componentInputs = Array.from({ length: componentCount }, (_, index) => componentFields.map(field => ({
    ...field,
    name: `components.${index}.${field.name}`,
    label: `Component ${index + 1} · ${field.label}`,
  }))).flat();
  const siteHref = `/customers/${customer.id}/sites/${site.id}`;
  return <Screen title="Register solar system" subtitle={customer.displayName + " · " + site.label}
    action={<Action href={siteHref}>Site details</Action>}>
    <RegistryForm fields={[...systemFields, ...componentInputs]} schema={createSystemSchema}
      build={values => ({
        siteId: site.id,
        label: values.label,
        capacityKw: values.capacityKw ? Number(values.capacityKw) : undefined,
        installedOn: values.installedOn,
        components: Array.from({ length: componentCount }, (_, index) => Object.fromEntries(
          componentFields.map(field => [field.name, values[`components.${index}.${field.name}`]]),
        )),
      })}
      controls={pending => <div className={css.actions}>
        <button type="button" className={css.secondary} disabled={pending || componentCount >= 200}
          onClick={() => setComponentCount(componentCount + 1)}>Add component fields</button>
        {componentCount > 0 && <button type="button" className={css.secondary} disabled={pending}
          onClick={() => setComponentCount(componentCount - 1)}>Remove last component</button>}
      </div>}
      save={registry.createSystem} onSaved={system => router.push("/systems/" + system.id)} action="Register system" />
  </Screen>;
}

function CustomerRoutes({ parts }: { parts: string[] }) {
  const { adapters: { registry } } = useAdapters();
  const router = useRouter();
  const [id, sites, siteId, systems, create] = parts;
  const load = useCallback(() => registry.getCustomer(id), [registry, id]);
  const base = "/customers/" + id;
  return <Query load={load}>{customer => {
    if (parts.length === 1) return <CustomerDetailScreen customer={customer} />;
    if (sites !== "sites") return <Missing href={base} />;
    if (siteId === "new" && parts.length === 3) return <Screen title="Add installation site" subtitle={customer.displayName} action={<Action href={base}>Customer details</Action>}>
      <RegistryForm fields={siteFields} schema={createSiteSchema} build={values => ({ ...values, customerId: id })}
        save={registry.createSite} onSaved={site => router.push(base + "/sites/" + site.id)} action="Create site" />
    </Screen>;
    const site = customer.sites.find(item => item.id === siteId);
    if (!site) return <Missing href={base} />;
    if (parts.length === 3) return <SiteDetail site={site} base={base} />;
    if (systems === "systems" && create === "new" && parts.length === 5) {
      return <RegisterSystem site={site} customer={customer} />;
    }
    return <Missing href={base} />;
  }}</Query>;
}

function EquipmentDetails({ component }: { component: Component }) {
  return <><p>{component.manufacturer} · {component.model} · {component.type}</p>
    <p>Serial number: {component.serialNumber}</p>
    <p>Installed: {component.installedOn}</p>
    <p>Warranty expiry: {component.warrantyExpiresOn ?? "Not recorded"}</p>
    <p className={css.badge}>{component.status}</p>
  </>;
}

function SystemDetails({ system }: { system: SystemDetail }) {
  const base = "/systems/" + system.id;
  return <Screen title={system.label} subtitle={system.customer.displayName + " · " + system.site.label} action={<Action href={base + "/components/new"} primary>Add component</Action>}>
    <div className={css.actions}><Action href="/systems">All systems</Action>
      <Action href={"/customers/" + system.customer.id + "/sites/" + system.site.id}>Site details</Action></div>
    <section className={css.panel}><h2>System summary</h2><p>{system.capacityKw} kWp · Installed {system.installedOn} · {system.active ? "Active" : "Inactive"}</p></section>
    <section className={css.panel}><h2>Components and warranties</h2>
      {system.components.length ? <div className={css.results}>{system.components.map(component => (
        <Card key={component.id} href={base + "/components/" + component.id} title={component.model}>
          <p>{component.serialNumber} · {component.status}</p><p>Warranty expiry: {component.warrantyExpiresOn ?? "Not recorded"}</p>
        </Card>
      ))}</div> : <p>No components registered yet.</p>}
    </section>
    <section className={css.panel}><h2>Replacement history</h2>
      {system.components.some(component => component.replacedComponentId) ? <ul>{system.components.filter(component => component.replacedComponentId).map(component => {
        const previous = system.components.find(old => old.id === component.replacedComponentId);
        return <li key={component.id}>{previous?.serialNumber ?? "Previous component"} → {component.serialNumber} · {component.installedOn}</li>;
      })}</ul> : <p>No replacements recorded.</p>}
    </section>
    <section className={css.panel}><h2>Maintenance plans</h2>
      <p>{system.plans.length ? system.plans.length + " linked plans" : "No maintenance plans linked."}</p>
    </section>
  </Screen>;
}

function SystemRoutes({ parts }: { parts: string[] }) {
  const { adapters: { registry } } = useAdapters();
  const router = useRouter();
  const [id, components, componentId, action] = parts;
  const load = useCallback(() => registry.getSystem(id), [registry, id]);
  const base = "/systems/" + id;
  return <Query load={load}>{system => {
    if (parts.length === 1) return <SystemDetails system={system} />;
    if (components !== "components") return <Missing href={base} />;
    const component = system.components.find(item => item.id === componentId);
    const replacing = parts.length === 4 && action === "replace" && component?.status === "active";
    if (replacing || (parts.length === 3 && componentId === "new")) {
      return <Screen title={replacing ? "Replace component" : "Add component"} subtitle={system.label} action={<Action href={base}>System details</Action>}>
        {replacing && <p>The previous component will remain in replacement history.</p>}
        <RegistryForm fields={componentFields} schema={createComponentSchema}
          build={values => ({ ...values, systemId: id, replacesComponentId: replacing ? component.id : undefined })}
          save={registry.createComponent} onSaved={saved => router.push(base + "/components/" + saved.id)}
          action={replacing ? "Save replacement" : "Create component"} />
      </Screen>;
    }
    if (!component || parts.length !== 3) return <Missing href={base} />;
    return <Screen title={component.model} subtitle={system.label}
      action={component.status === "active" && <Action href={base + "/components/" + component.id + "/replace"} primary>Replace component</Action>}>
      <Action href={base}>System details</Action>
      <section className={css.panel}><h2>Equipment record</h2><EquipmentDetails component={component} />
        {component.replacedComponentId && <Action href={base + "/components/" + component.replacedComponentId}>Previous component</Action>}
      </section>
    </Screen>;
  }}</Query>;
}

export function RegistryScreen({ area, parts }: { area: Area; parts: string[] }) {
  const { auth } = useAdapters();
  if (auth.status !== "signed-in" || auth.session.role !== "coordinator") {
    return <Screen title="Permission denied"><section className={css.panel}><p>The registry is available to coordinators in the mock workspace.</p><Action href="/technician">My jobs</Action></section></Screen>;
  }
  if (!parts.length) return <ListScreen area={area} />;
  if (area === "customers") return parts.length === 1 && parts[0] === "new" ? <NewCustomer /> : <CustomerRoutes parts={parts} />;
  return <SystemRoutes parts={parts} />;
}
