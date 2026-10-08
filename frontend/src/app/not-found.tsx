import Link from "next/link";

import { routes } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-zoom-blue">404</p>
      <h1 className="text-2xl font-bold">This page doesn&apos;t exist</h1>
      <p className="text-ink-subtle">The link may be broken, or the page may have been removed.</p>
      <Link
        href={routes.home}
        className="mt-2 rounded-lg bg-zoom-blue px-4 py-2 text-sm font-semibold text-white hover:bg-zoom-blue-hover"
      >
        Back to Home
      </Link>
    </main>
  );
}
