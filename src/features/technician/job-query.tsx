"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import type { ApiResult } from "@/types";

type JobQueryProps<T> = {
  load: () => Promise<ApiResult<T>>;
  loadingMessage: string;
  errorMessage: string;
  deniedMessage: string;
  unavailable?: { title: string; message: string };
  children: (data: T) => ReactNode;
};

export function JobQuery<T>({ load, loadingMessage, errorMessage, deniedMessage, unavailable, children }: JobQueryProps<T>) {
  const { dataVersion } = useAdapters();
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{
    load: typeof load;
    dataVersion: number;
    attempt: number;
    result: ApiResult<T>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const publish = (result: ApiResult<T>) => {
      if (active) setResponse({ load, dataVersion, attempt, result });
    };
    void load().then(publish).catch(() => {
      publish({ ok: false, status: 500, error: { code: "INTERNAL", message: errorMessage } });
    });
    return () => { active = false; };
  }, [load, dataVersion, attempt, errorMessage]);

  if (response?.load !== load || response.dataVersion !== dataVersion || response.attempt !== attempt) {
    return (
      <p role="status" className="rounded-pc-card border border-pc-border bg-pc-surface p-5 text-pc-muted">
        {loadingMessage}
      </p>
    );
  }

  const { result } = response;
  if (result.ok) return children(result.data);

  const panel = "space-y-2 rounded-pc-card border border-pc-border bg-pc-surface p-5";
  if (result.error.code === "FORBIDDEN") {
    return (
      <div role="alert" className={panel}>
        <h2 className="font-semibold">Permission denied</h2>
        <p>{deniedMessage}</p>
      </div>
    );
  }
  if (result.error.code === "NOT_FOUND") {
    return (
      <div role="alert" className={panel}>
        <h2 className="font-semibold">{unavailable?.title ?? "Job unavailable"}</h2>
        <p>{unavailable?.message ?? "This job could not be found."}</p>
      </div>
    );
  }
  if (result.error.code === "UNAUTHENTICATED") {
    return (
      <div role="alert" className={panel}>
        <h2 className="font-semibold">Demo session expired</h2>
        <p>Sign out and sign in again to continue.</p>
      </div>
    );
  }

  return (
    <div className={panel}>
      <p role="alert" className="font-semibold">{errorMessage}</p>
      <button
        className="min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-4 font-semibold hover:bg-pc-canvas"
        type="button"
        onClick={() => setAttempt((previous) => previous + 1)}
      >
        Retry
      </button>
    </div>
  );
}
