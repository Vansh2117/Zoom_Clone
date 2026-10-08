import type { Metadata } from "next";

import { JoinMeetingForm } from "@/components/join/join-meeting-form";

export const metadata: Metadata = { title: "Join Meeting" };

export default function JoinPage() {
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center pt-24 md:pt-32">
      <h1 className="mb-10 text-2xl font-bold text-ink">Join Meeting</h1>
      <JoinMeetingForm />
    </div>
  );
}
