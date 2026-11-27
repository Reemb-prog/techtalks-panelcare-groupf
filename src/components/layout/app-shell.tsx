"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MOCK_SCENARIOS, type MockScenario } from "@/lib/adapters";
import type { Session } from "@/types";
import { useAdapters } from "./adapters-provider";
import { BrandMark } from "./brand-mark";
import { ROLE_LABEL, roleHome } from "./nav-items";
import { SidebarNav } from "./sidebar-nav";

const SCENARIO_LABEL: Record<MockScenario, string> = {
  ok: "Normal data",
  empty: "No records",
  slow: "Slow responses",
  error: "Server error",
  denied: "Permission denied",
};

/** Signed-in frame: mock banner, sidebar (drawer below lg), top bar with search, and the main region. */
export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const router = useRouter();
  const { signOut } = useAdapters();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    drawerRef.current?.close();
  }

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-pc-control bg-pc-surface px-4 py-2 font-semibold text-pc-primary shadow-pc-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <MockBanner />

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-pc-border bg-pc-surface lg:flex">
          <div className="flex flex-1 flex-col gap-7 px-4 py-5">
            <Brand session={session} />
            <SidebarNav role={session.role} />
          </div>
          <UserPanel session={session} onSignOut={handleSignOut} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-pc-border bg-pc-surface px-4 py-2.5 sm:px-6">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => drawerRef.current?.showModal()}
              aria-haspopup="dialog"
              aria-controls="nav-drawer"
              className="inline-flex min-h-[var(--pc-control-min-height)] min-w-[var(--pc-control-min-height)] items-center justify-center rounded-pc-control border border-pc-border lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <span className="sr-only">Open menu</span>
            </button>
            {session.role === "coordinator" ? <SearchForm /> : <div className="flex-1" />}
            <p className="hidden items-center gap-2 text-[length:var(--pc-type-control)] sm:flex lg:hidden">
              <span className="font-semibold">{session.displayName}</span>
              <RoleChip session={session} />
            </p>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8 lg:py-9">
            {children}
          </main>
        </div>
      </div>

      <dialog
        id="nav-drawer"
        ref={drawerRef}
        aria-label="Menu"
        onClose={() => menuButtonRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDrawer();
        }}
        className="m-0 h-full max-h-none w-72 max-w-[85vw] bg-pc-surface p-0 text-pc-text shadow-pc-overlay"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-7 px-4 py-5">
            <div className="flex items-center justify-between gap-2">
              <Brand session={session} />
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex min-h-[var(--pc-control-min-height)] min-w-[var(--pc-control-min-height)] items-center justify-center rounded-pc-control border border-pc-border"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <SidebarNav role={session.role} onNavigate={closeDrawer} />
          </div>
          <UserPanel session={session} onSignOut={handleSignOut} />
        </div>
      </dialog>
    </div>
  );
}

function Brand({ session }: { session: Session }) {
  return (
    <Link href={roleHome(session.role)} className="flex items-center gap-3 rounded-pc-control">
      <BrandMark />
      <span className="text-[length:var(--pc-type-card)] font-bold">PanelCare</span>
    </Link>
  );
}

function RoleChip({ session }: { session: Session }) {
  return (
    <span className="rounded-pc-pill bg-pc-info-bg px-2 text-[length:var(--pc-type-caption)] leading-[var(--pc-line-caption)] font-semibold text-pc-info-text">
      Demo {ROLE_LABEL[session.role].toLowerCase()}
    </span>
  );
}

function UserPanel({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-pc-border p-4">
      <div>
        <p className="font-semibold">{session.displayName}</p>
        <RoleChip session={session} />
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-3 font-semibold hover:bg-pc-canvas"
      >
        Sign out
      </button>
    </div>
  );
}

/** Search entry: hands the query to the customer list (PC-S1-06 owns /customers and its `q` filter). */
function SearchForm() {
  const [query, setQuery] = useState("");
  return (
    <form role="search" action="/customers" method="get" className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search customers, sites and systems
      </label>
      <input
        id="global-search"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customers, sites, systems"
        autoComplete="off"
        className="min-h-[var(--pc-control-min-height)] min-w-0 flex-1 rounded-pc-control border border-pc-control-border bg-pc-surface px-3 text-[length:var(--pc-type-control)] placeholder:text-pc-muted"
      />
      <button
        type="submit"
        disabled={query.trim() === ""}
        className="min-h-[var(--pc-control-min-height)] rounded-pc-control bg-pc-primary px-3 text-[length:var(--pc-type-control)] font-semibold text-pc-on-primary hover:bg-pc-primary-hover disabled:cursor-not-allowed disabled:bg-pc-disabled disabled:text-pc-muted"
      >
        Search
      </button>
    </form>
  );
}

/** Always-visible notice that the app runs on mock data, with the demo scenario switcher. */
function MockBanner() {
  const { scenario, setScenario } = useAdapters();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <div role="region" aria-label="Mock mode" className="border-b border-pc-warning-text/15 bg-pc-warning-bg text-pc-warning-text">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)] sm:px-6">
        <p className="flex-1 basis-64">
          <span className="mr-2 rounded-pc-control border border-pc-warning-text/25 px-1.5 text-[length:var(--pc-type-caption)] font-semibold">
            Mock
          </span>
          Demo data in this tab only. Nothing is saved and this is not a real sign-in.
        </p>
        <label className="flex items-center gap-2 font-semibold">
          Mock data
          <select
            value={scenario}
            disabled={!hydrated}
            onChange={(event) => setScenario(event.target.value as MockScenario)}
            className="min-h-9 rounded-pc-control border border-pc-warning-text/55 bg-pc-surface px-2 font-normal text-pc-text"
          >
            {MOCK_SCENARIOS.map((value) => (
              <option key={value} value={value}>
                {SCENARIO_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
