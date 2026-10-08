"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-meetings";

export function ProfileCard() {
  const { data: user, isPending } = useCurrentUser();

  return (
    <Card aria-label="Profile" className="flex flex-wrap items-center gap-4 p-6">
      <Avatar name={user?.name ?? " "} variant="dark" className="size-[78px] rounded-2xl text-2xl" />
      <div className="min-w-0 flex-1">
        {isPending ? (
          <div className="h-7 w-48 animate-pulse rounded bg-surface-subtle" />
        ) : (
          <h1 className="truncate text-2xl font-semibold text-ink">{user?.name ?? "Guest"}</h1>
        )}
      </div>
    </Card>
  );
}
