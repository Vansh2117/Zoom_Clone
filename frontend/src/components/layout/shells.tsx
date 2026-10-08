import type { ReactNode } from "react";

import { MainNav } from "./main-nav";
import { Sidebar } from "./sidebar";
import { TopUtilityBar } from "./top-utility-bar";

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-md bg-zoom-blue px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to main content
    </a>
  );
}

/** Signed-in web portal: utility bar, main navigation, left sidebar. */
export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <TopUtilityBar />
      <MainNav />
      <div className="flex">
        <Sidebar />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </>
  );
}

/** Minimal layout used by the standalone Join page (no sidebar, footer at the bottom). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <MainNav showMarketingLinks={false} />
      <main id="main-content" className="flex-1 px-4">
        {children}
      </main>
      <footer className="py-8 text-center text-[13px] text-ink-subtle">
        Zoom Clone · Built as a full-stack engineering assignment. Not affiliated with Zoom.
      </footer>
    </div>
  );
}
