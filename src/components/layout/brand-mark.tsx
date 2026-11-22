/** PanelCare logo mark: a solar panel on a primary tile. Decorative; pair it with the visible product name. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--pc-color-primary)" />
      <path d="M8 20h16l-3-9H11z" fill="none" stroke="var(--pc-color-on-primary)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 11v9M9.5 15.5h13" stroke="var(--pc-color-on-primary)" strokeWidth="1.5" />
      <path d="M13 24h6" stroke="var(--pc-color-on-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
