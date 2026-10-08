import { notFound } from "next/navigation";

import { MeetingDetails } from "@/components/meetings/meeting-details";
import { isValidMeetingCode } from "@/lib/validation";

export default async function MeetingDetailsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isValidMeetingCode(code)) notFound();
  return <MeetingDetails code={code} />;
}
