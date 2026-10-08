"use client";

import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { QueryError } from "@/components/ui/query-error";
import { PageSpinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-meetings";
import { formatMeetingCode } from "@/lib/datetime";

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 md:grid-cols-[200px_1fr] md:gap-4">
      <dt className="text-[15px] text-ink-subtle">{label}</dt>
      <dd className="min-w-0 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

/** Read-only profile of the default logged-in user (there is no sign-up, so nothing to edit). */
export function ProfileDetails() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser();

  if (isPending) return <PageSpinner />;
  if (isError) return <QueryError error={error} onRetry={() => refetch()} className="py-16" />;

  return (
    <div className="mx-auto max-w-[1080px]">
      <h1 className="text-2xl font-bold text-ink">Profile</h1>

      <div className="mt-6 flex flex-wrap items-center gap-5 border-b border-line pb-6">
        <Avatar name={user.name} variant="dark" className="size-[96px] rounded-2xl text-3xl" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-ink">{user.name}</p>
          <p className="mt-1 break-all text-[15px] text-ink-subtle">{user.email}</p>
        </div>
      </div>

      <dl>
        <ProfileRow label="Display Name">{user.name}</ProfileRow>
        <ProfileRow label="Sign-In Email">
          <span className="break-all">{user.email}</span>
        </ProfileRow>
        <ProfileRow label="Personal Meeting ID">
          <span className="flex items-center gap-2">
            {formatMeetingCode(user.personal_meeting_id)}
            <CopyButton
              iconOnly
              text={user.personal_meeting_id}
              label="Copy Personal Meeting ID"
              successMessage="Personal Meeting ID copied"
            />
          </span>
        </ProfileRow>
      </dl>
    </div>
  );
}
