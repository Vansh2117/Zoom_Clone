"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-meetings";
import { routes } from "@/lib/constants";
import { showNotAvailable } from "@/lib/not-available";

/** Profile opens the profile page; Settings and Sign Out are placeholders (no auth in this clone). */
export function UserMenu() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const name = user?.name ?? "User";

  return (
    <DropdownMenu
      label={
        <span className="block">
          <span className="block text-sm font-semibold text-ink">{name}</span>
          <span className="block">{user?.email}</span>
        </span>
      }
      trigger={
        <button type="button" aria-label="Open profile menu" className="rounded-lg">
          <Avatar name={name} variant="dark" className="size-9 text-sm" />
        </button>
      }
      items={[
        { label: "Profile", icon: <UserRound className="size-4" aria-hidden />, onSelect: () => router.push(routes.profile) },
        { label: "Settings", icon: <Settings className="size-4" aria-hidden />, onSelect: () => showNotAvailable("Settings") },
        { label: "Sign Out", icon: <LogOut className="size-4" aria-hidden />, onSelect: () => showNotAvailable("Sign out") },
      ]}
    />
  );
}
