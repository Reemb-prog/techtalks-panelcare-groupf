"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import { roleHome } from "@/components/layout/nav-items";
import type { Role } from "@/types";
import { appName } from "../../site";

const DEMO_ROLES: { role: Role; title: string; description: string }[] = [
  {
    role: "coordinator",
    title: "Continue as demo coordinator",
    description: "Plan maintenance, register systems and dispatch visits.",
  },
  {
    role: "technician",
    title: "Continue as demo technician",
    description: "See assigned visits and complete inspections on site.",
  },
];

/** MOCK sign-in (PC-S1-05): demo role selection only. There is deliberately no password field. */
export function MockSignIn() {
  const router = useRouter();
  const { auth, signInAs } = useAdapters();
  const [pending, setPending] = useState<Role | null>(null);

  // A tab that is already signed in goes straight to its role home.
  useEffect(() => {
    if (auth.status === "signed-in") router.replace(roleHome(auth.session.role));
  }, [auth, router]);

  function choose(role: Role) {
    if (pending) return;
    setPending(role);
    signInAs(role);
    router.push(roleHome(role));
  }

  const checking = auth.status === "loading";

  return (
    <div className="grid min-h-screen bg-pc-surface lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <main className="flex flex-col justify-between gap-10 px-5 py-7 sm:px-10 lg:px-14 lg:py-10">
        <header className="flex items-center gap-3">
          <BrandMark />
          <span className="text-[length:var(--pc-type-card)] font-bold">{appName}</span>
        </header>

        <div className="mx-auto w-full max-w-md">
          {/* 1. Brand and promise */}
          <h1 className="text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold lg:text-[length:var(--pc-type-display)] lg:leading-[var(--pc-line-display)]">Sign in to {appName}</h1>
          <p className="mt-2 text-pc-muted">Preventive solar maintenance, planned and dispatched in one place.</p>

          {/* 3. Safe demo notice (kept above the actions so it is read first) */}
          <div
            role="note"
            aria-label="Mock sign-in"
            className="mt-6 rounded-pc-card border border-pc-warning-text/20 bg-pc-warning-bg px-4 py-3 text-pc-warning-text"
          >
            <p className="text-sm font-semibold">Demo sign-in, not a real login</p>
            <p className="mt-1 text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)]">
              Pick a demo role to explore with sample data. There is no password, nothing is saved, and the choice lasts only
              for this browser tab.
            </p>
          </div>

          {/* 2. Role selection card */}
          <section aria-labelledby="demo-roles" className="mt-8">
            <h2 id="demo-roles" className="text-[length:var(--pc-type-card)] font-semibold">
              Choose a demo role
            </h2>
            <ul className="mt-3 flex flex-col gap-4">
              {DEMO_ROLES.map(({ role, title, description }) => (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => choose(role)}
                    disabled={checking || pending !== null}
                    aria-describedby={`${role}-description`}
                    className={
                      role === "coordinator"
                        ? "min-h-[var(--pc-control-min-height)] w-full rounded-pc-control bg-pc-primary px-4 py-3 text-left font-semibold text-pc-on-primary hover:bg-pc-primary-hover disabled:cursor-not-allowed disabled:bg-pc-disabled disabled:text-pc-muted"
                        : "min-h-[var(--pc-control-min-height)] w-full rounded-pc-control border border-pc-control-border bg-pc-surface px-4 py-3 text-left font-semibold hover:bg-pc-accent disabled:cursor-not-allowed disabled:bg-pc-disabled disabled:text-pc-muted"
                    }
                  >
                    {pending === role ? "Opening…" : title}
                  </button>
                  <p id={`${role}-description`} className="mt-1 px-1 text-[length:var(--pc-type-control)] text-pc-muted">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="sr-only">
              {checking ? "Checking for an existing demo session" : ""}
            </p>
          </section>
        </div>

        {/* 4. Privacy footer */}
        <footer className="text-[length:var(--pc-type-caption)] leading-[var(--pc-line-caption)] text-pc-muted">
          All people, sites and systems shown are synthetic sample data. Real sign-in and private customer records arrive with the
          production release.
        </footer>
      </main>

      <aside aria-hidden="true" className="hidden items-center bg-pc-text px-12 text-pc-on-primary lg:flex xl:px-20">
        <div className="max-w-md">
          <BrandMark size={72} />
          <p className="mt-8 max-w-[12ch] text-[length:var(--pc-type-display)] leading-[var(--pc-line-display)] font-semibold tracking-tight">
            Every system on schedule.
          </p>
          <p className="mt-4 max-w-xs text-pc-accent">Upcoming visits, overdue work and expiring warranties at a glance.</p>
        </div>
      </aside>
    </div>
  );
}
