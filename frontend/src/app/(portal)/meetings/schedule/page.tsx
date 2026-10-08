"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ScheduleMeetingForm } from "@/components/meetings/schedule-meeting-form";
import { useScheduleMeeting } from "@/hooks/use-meetings";
import { routes } from "@/lib/constants";
import type { ScheduleMeetingInput } from "@/types/api";

export default function ScheduleMeetingPage() {
  const router = useRouter();
  const schedule = useScheduleMeeting();

  const handleSubmit = async (input: ScheduleMeetingInput) => {
    const meeting = await schedule.mutateAsync(input);
    toast.success("Meeting scheduled");
    router.push(routes.meetingDetails(meeting.meeting_code));
    return meeting;
  };

  return (
    <div className="mx-auto max-w-[1080px]">
      <Link href={routes.meetings} className="inline-flex items-center gap-1 text-[15px] text-zoom-blue hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        Back to Meetings
      </Link>
      <h1 className="mt-6 mb-8 text-2xl font-bold text-ink">Schedule Meeting</h1>
      <ScheduleMeetingForm onSubmit={handleSubmit} onCancel={() => router.push(routes.meetings)} />
    </div>
  );
}
