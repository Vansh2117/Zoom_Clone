import { fireEvent, screen, waitFor } from "@testing-library/react";

import { mockRouter } from "@/test/router";
import {
  callsTo,
  defaultUser,
  errorResponse,
  jsonResponse,
  makeMeeting,
  mockApi,
  renderWithProviders,
} from "@/test/utils";

import { QuickActionsCard } from "./quick-actions-card";
import { RecentActivityCard } from "./recent-activity-card";
import { UpcomingMeetingsCard } from "./upcoming-meetings-card";

describe("UpcomingMeetingsCard", () => {
  it("shows an empty state instead of a blank card", async () => {
    mockApi({ "GET /meetings/upcoming": () => jsonResponse([]) });
    renderWithProviders(<UpcomingMeetingsCard />);
    expect(await screen.findByText("No Upcoming Meetings")).toBeInTheDocument();
  });

  it("lists meetings with Start / Join actions and a copy-link button", async () => {
    mockApi({
      "GET /meetings/upcoming": () =>
        jsonResponse([
          makeMeeting({ meeting_code: "1111111111", title: "Live now", status: "active" }),
          makeMeeting({ meeting_code: "2222222222", title: "Tomorrow's sync" }),
        ]),
    });
    renderWithProviders(<UpcomingMeetingsCard />);

    expect(await screen.findByText("Live now")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow's sync")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join Live now" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy link" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Start Tomorrow's sync" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/j/2222222222?role=host");
  });

  it("shows a retryable error when the backend is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    renderWithProviders(<UpcomingMeetingsCard />);

    expect(await screen.findByText("Couldn't load this")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("RecentActivityCard", () => {
  it("shows the Zoom empty state", async () => {
    mockApi({ "GET /meetings/recent": () => jsonResponse([]) });
    renderWithProviders(<RecentActivityCard />);
    expect(await screen.findByText("No recent activity")).toBeInTheDocument();
  });

  it("lists ended meetings with participant counts", async () => {
    mockApi({
      "GET /meetings/recent": () =>
        jsonResponse([
          makeMeeting({
            title: "Sprint Planning",
            status: "ended",
            ended_at: new Date().toISOString(),
            participant_count: 4,
          }),
        ]),
    });
    renderWithProviders(<RecentActivityCard />);

    expect(await screen.findByText("Sprint Planning")).toBeInTheDocument();
    expect(screen.getByText("4 participants")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });
});

describe("QuickActionsCard", () => {
  it("shows the personal meeting ID", async () => {
    mockApi({ "GET /me": () => jsonResponse(defaultUser) });
    renderWithProviders(<QuickActionsCard />);
    expect(await screen.findByText("329 759 7040")).toBeInTheDocument();
  });

  it("creates exactly one meeting on a double click and opens the host pre-join screen", async () => {
    const fetchMock = mockApi({
      "GET /me": () => jsonResponse(defaultUser),
      "POST /meetings/instant": () =>
        jsonResponse(makeMeeting({ meeting_code: "5555555555", status: "active", is_instant: true }), 201),
    });
    renderWithProviders(<QuickActionsCard />);

    const button = screen.getByRole("button", { name: "New Meeting" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/j/5555555555?role=host"));
    expect(callsTo(fetchMock, "POST /meetings/instant")).toHaveLength(1);
  });

  it("navigates to Schedule and Join", () => {
    mockApi({ "GET /me": () => jsonResponse(defaultUser) });
    renderWithProviders(<QuickActionsCard />);

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/meetings/schedule");
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/join");
  });

  it("reports a failure to create a meeting", async () => {
    mockApi({
      "GET /me": () => jsonResponse(defaultUser),
      "POST /meetings/instant": () => errorResponse(500, "INTERNAL_ERROR", "boom"),
    });
    renderWithProviders(<QuickActionsCard />);

    fireEvent.click(screen.getByRole("button", { name: "New Meeting" }));

    expect(await screen.findByText("Something went wrong on our side. Please try again.")).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
