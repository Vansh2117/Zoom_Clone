import type { Metadata } from "next";

import { MeetingsTabs } from "@/components/meetings/meetings-tabs";

export const metadata: Metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return <MeetingsTabs />;
}
