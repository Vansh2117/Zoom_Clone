import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MeetingRoomPage } from "@/components/room/meeting-room-page";
import { isValidMeetingCode } from "@/lib/validation";

export const metadata: Metadata = { title: "Meeting" };

export default async function MeetingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isValidMeetingCode(code)) notFound();
  return <MeetingRoomPage code={code} />;
}
