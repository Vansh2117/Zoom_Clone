import { ProfileCard } from "@/components/dashboard/profile-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { UpcomingMeetingsCard } from "@/components/dashboard/upcoming-meetings-card";

/** Home dashboard, laid out like Zoom's web portal: content left, actions right. */
export default function HomePage() {
  return (
    <div className="mx-auto grid max-w-[1080px] gap-6 lg:grid-cols-[minmax(0,1fr)_328px]">
      {/* On small screens the action cards come first: they are what users need most. */}
      <div className="flex flex-col gap-6 lg:order-2">
        <QuickActionsCard />
        <UpcomingMeetingsCard />
      </div>
      <div className="flex flex-col gap-6 lg:order-1">
        <ProfileCard />
        <RecentActivityCard />
      </div>
    </div>
  );
}
