"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types";
import { NavIcon } from "./nav-icon";
import { isActivePath, navFor } from "./nav-items";

/** Primary navigation list, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-1">
        {navFor(role).map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-[var(--pc-control-min-height)] items-center gap-3 rounded-pc-control px-3 font-semibold " +
                  (active ? "bg-pc-accent text-pc-primary-hover" : "text-pc-muted hover:bg-pc-canvas hover:text-pc-text")
                }
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
