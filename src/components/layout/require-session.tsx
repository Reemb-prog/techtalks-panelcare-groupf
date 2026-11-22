"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Session } from "@/types";
import { useAdapters } from "./adapters-provider";

/** Renders children only for a signed-in (mock) tab; otherwise sends the visitor to /login. UI routing, not security. */
export function RequireSession({ children }: { children: (session: Session) => ReactNode }) {
  const router = useRouter();
  const { auth } = useAdapters();

  useEffect(() => {
    if (auth.status === "signed-out") router.replace("/login");
  }, [auth, router]);

  if (auth.status !== "signed-in") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" aria-busy="true">
        <p role="status" className="text-pc-muted">
          {auth.status === "loading" ? "Checking your demo session…" : "Redirecting to sign in…"}
        </p>
      </div>
    );
  }
  return <>{children(auth.session)}</>;
}
