import type { ReactNode } from "react";

export function LoadingSkeleton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p role="status" className="sr-only">{label}</p>
      <div aria-hidden="true" aria-busy="true" data-testid="loading-skeleton" className="motion-safe:animate-pulse">
        {children}
      </div>
    </div>
  );
}

export const skeletonFill = "rounded-pc-control bg-pc-border";

const skeletonPanel = "rounded-pc-card border border-pc-border bg-pc-surface p-4 sm:p-5";

export function ContentSkeleton({ label, layout }: { label: string; layout: "cards" | "rows" | "detail" | "form" }) {
  const grid = layout === "cards" ? "sm:grid-cols-2 xl:grid-cols-3" : "";

  return (
    <LoadingSkeleton label={label}>
      <div className={`grid gap-3 ${grid}`}>
        {layout === "rows" ? (
          <div className={`${skeletonPanel} space-y-4`}>
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="grid grid-cols-2 gap-4 border-b border-pc-border pb-4 last:border-0 last:pb-0 sm:grid-cols-4">
                <div className={`${skeletonFill} h-4 w-4/5`} />
                <div className={`${skeletonFill} h-4 w-2/3`} />
                <div className={`${skeletonFill} hidden h-4 w-3/4 sm:block`} />
                <div className={`${skeletonFill} hidden h-4 w-1/2 sm:block`} />
              </div>
            ))}
          </div>
        ) : (
          (layout === "detail" ? [0, 1] : [0, 1, 2]).map((section) => (
            <div key={section} className={`${skeletonPanel} space-y-3`}>
              <div className={`${skeletonFill} h-4 w-2/5 max-w-48`} />
              <div className={`${skeletonFill} ${layout === "form" ? "h-11 w-full" : "h-3 w-3/4 max-w-80"}`} />
              {layout !== "form" && <div className={`${skeletonFill} h-3 w-1/2 max-w-56`} />}
            </div>
          ))
        )}
      </div>
    </LoadingSkeleton>
  );
}
