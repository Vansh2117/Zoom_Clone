import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PreJoinScreen } from "@/components/prejoin/prejoin-screen";
import { isValidMeetingCode } from "@/lib/validation";

export const metadata: Metadata = { title: "Join Meeting" };

/**
 * Public invite link: /j/{code}. Dashboard actions add `?role=host` (and
 * `?video=off` for "Host with video off"); the backend still verifies the host.
 */
export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ role?: string; video?: string }>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  if (!isValidMeetingCode(code)) notFound();

  return <PreJoinScreen code={code} wantsHost={query.role === "host"} startWithVideoOff={query.video === "off"} />;
}
