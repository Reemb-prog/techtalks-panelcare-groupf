import type { NavIcon as NavIconName } from "./nav-items";

const PATHS: Record<NavIconName, string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  customers: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6",
  systems: "M3 17h18l-3-10H6zM12 7v10M4.5 12h15M9 21h6",
  maintenance: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3",
  dispatch: "M3 7h11v9H3zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  jobs: "M6 4h12v17H6zM9 4V2.5h6V4M9 10h6M9 14h6M9 18h3",
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={PATHS[name]} />
    </svg>
  );
}
