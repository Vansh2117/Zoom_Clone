"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { routes } from "@/lib/constants";
import { showNotAvailable } from "@/lib/not-available";

interface NavLink {
  label: string;
  href?: string;
  external?: boolean;
  isNew?: boolean;
}

const PRODUCTS: NavLink[] = [
  { label: "Meetings", href: routes.meetings },
  { label: "Recordings" },
  { label: "Summaries" },
  { label: "Hub", external: true, isNew: true },
  { label: "Whiteboards", external: true },
  { label: "Notes" },
  { label: "Clips", external: true },
  { label: "Scheduler", external: true },
  { label: "Discover More Products" },
];

const ACCOUNT: NavLink[] = [{ label: "My Account" }, { label: "Admin" }, { label: "Support" }];

function isActive(pathname: string, href: string): boolean {
  return href === routes.home ? pathname === href : pathname.startsWith(href);
}

const itemClass =
  "flex w-full items-center gap-2 rounded-lg py-2 pr-3 pl-6 text-left text-[15px] text-ink transition-colors hover:bg-white";

function SidebarItem({ item, pathname, onNavigate }: { item: NavLink; pathname: string; onNavigate?: () => void }) {
  const content = (
    <>
      <span className="flex-1">{item.label}</span>
      {item.isNew && (
        <span className="rounded-full border border-zoom-blue px-1.5 text-[11px] leading-4 text-zoom-blue">New</span>
      )}
      {item.external && <ExternalLink className="size-4 text-ink-subtle" aria-hidden />}
    </>
  );

  if (item.href) {
    const active = isActive(pathname, item.href);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(itemClass, active && "bg-zoom-blue-soft font-medium text-zoom-blue hover:bg-zoom-blue-soft")}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={itemClass} onClick={() => showNotAvailable(item.label)}>
      {content}
    </button>
  );
}

/** Navigation list, shared by the desktop sidebar and the mobile slide-in menu. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? routes.home;

  return (
    <nav aria-label="Portal" className="flex flex-col gap-0.5 p-3">
      <SidebarItem item={{ label: "Home", href: routes.home }} pathname={pathname} onNavigate={onNavigate} />
      <p className="mt-4 mb-1 px-3 text-[13px] text-ink-subtle">My Products</p>
      {PRODUCTS.map((item) => (
        <SidebarItem key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
      <div className="mt-6 flex flex-col gap-0.5">
        {ACCOUNT.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => showNotAvailable(item.label)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] text-ink hover:bg-white"
          >
            <ChevronRight className="size-4 text-ink-subtle" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 overflow-y-auto bg-sidebar lg:block">
      <SidebarNav />
    </aside>
  );
}
