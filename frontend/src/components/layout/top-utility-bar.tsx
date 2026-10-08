"use client";

import { Search } from "lucide-react";

import { showNotAvailable } from "@/lib/not-available";

const LINKS = ["Support"];

/** The thin navy strip above Zoom's main navigation (desktop only). */
export function TopUtilityBar() {
  return (
    <div className="hidden h-10 items-center justify-end gap-6 bg-zoom-navy px-6 text-[14px] font-medium text-white md:flex">
      <button type="button" onClick={() => showNotAvailable("Search")} className="flex items-center gap-1.5 hover:underline">
        <Search className="size-[18px]" aria-hidden />
        Search
      </button>
      {LINKS.map((label) => (
        <button key={label} type="button" onClick={() => showNotAvailable(label)} className="hover:underline">
          {label}
        </button>
      ))}
    </div>
  );
}
