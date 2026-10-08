import type { Meeting } from "@/types/api";

import { formatFullDateTime, formatMeetingCode, getTimezoneLabel } from "./datetime";

/** The text Zoom puts on the clipboard for "Copy Invitation". */
export function buildInvitationText(meeting: Meeting): string {
  const lines = [
    `${meeting.host.name} is inviting you to a ${meeting.is_instant ? "" : "scheduled "}Zoom meeting.`,
    "",
    `Topic: ${meeting.title}`,
  ];
  if (!meeting.is_instant) {
    lines.push(`Time: ${formatFullDateTime(meeting.scheduled_at)} ${getTimezoneLabel()}`);
  }
  lines.push(
    "",
    "Join Zoom Meeting",
    meeting.invite_url,
    "",
    `Meeting ID: ${formatMeetingCode(meeting.meeting_code)}`,
  );
  return lines.join("\n");
}
