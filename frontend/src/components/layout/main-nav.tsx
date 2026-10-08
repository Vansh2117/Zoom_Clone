"use client";

import { ChevronDown, Menu, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Sheet } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useStartInstantMeeting } from "@/hooks/use-start-instant-meeting";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/constants";
import { showNotAvailable } from "@/lib/not-available";

import { Logo } from "./logo";
import { SidebarNav } from "./sidebar";
import { UserMenu } from "./user-menu";

const MARKETING_LINKS = ["Products", "Solutions", "Resources", "Plans & Pricing"];

const navItemClass = "rounded-md px-2 py-1.5 text-[17px] font-semibold text-ink-muted hover:text-zoom-blue";

export function MainNav({ showMarketingLinks = true }: { showMarketingLinks?: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { start, isPending } = useStartInstantMeeting();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="flex h-16 items-center gap-2 px-4 md:px-6">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(true)}
          className="-ml-1 rounded-md p-2 text-ink-muted hover:bg-surface-subtle lg:hidden"
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <Logo />

        {showMarketingLinks && (
          <nav aria-label="Marketing" className="ml-6 hidden items-center gap-4 xl:flex">
            {MARKETING_LINKS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => showNotAvailable(label)}
                className="px-2 text-[17px] text-ink-muted hover:text-zoom-blue"
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        <nav aria-label="Meeting actions" className="ml-auto flex items-center gap-1 md:gap-3">
          <Link href={routes.schedule} className={cn(navItemClass, "hidden sm:inline-block")}>
            Schedule
          </Link>
          <Link href={routes.join} className={cn(navItemClass, "hidden sm:inline-block")}>
            Join
          </Link>
          <DropdownMenu
            trigger={
              <button type="button" disabled={isPending} className={cn(navItemClass, "hidden items-center gap-1 sm:flex")}>
                Host <ChevronDown className="size-4" aria-hidden />
              </button>
            }
            items={[
              { label: "With Video On", icon: <Video className="size-4" aria-hidden />, onSelect: () => start() },
              {
                label: "With Video Off",
                icon: <VideoOff className="size-4" aria-hidden />,
                onSelect: () => start({ videoOff: true }),
              },
            ]}
          />
          <DropdownMenu
            trigger={
              <button type="button" className={cn(navItemClass, "hidden items-center gap-1 md:flex")}>
                Web App <ChevronDown className="size-4" aria-hidden />
              </button>
            }
            items={[
              { label: "Join a meeting", onSelect: () => router.push(routes.join) },
              { label: "Schedule a meeting", onSelect: () => router.push(routes.schedule) },
            ]}
          />
          <div className="ml-1">
            <UserMenu />
          </div>
        </nav>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
        <div className="flex flex-col gap-1 border-b border-line p-3 sm:hidden">
          <Link href={routes.schedule} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 font-semibold hover:bg-white">
            Schedule
          </Link>
          <Link href={routes.join} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 font-semibold hover:bg-white">
            Join
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMenuOpen(false);
              void start();
            }}
            className="rounded-md px-3 py-2 text-left font-semibold hover:bg-white"
          >
            Host a meeting
          </button>
        </div>
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
      </Sheet>
    </header>
  );
}
