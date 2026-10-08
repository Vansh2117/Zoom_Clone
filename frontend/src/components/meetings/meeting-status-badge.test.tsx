import { render, screen } from "@testing-library/react";

import { makeMeeting } from "@/test/utils";

import { MeetingStatusBadge } from "./meeting-status-badge";

describe("MeetingStatusBadge", () => {
  it("marks live meetings", () => {
    render(<MeetingStatusBadge meeting={makeMeeting({ status: "active" })} />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("marks ended meetings", () => {
    render(<MeetingStatusBadge meeting={makeMeeting({ status: "ended" })} />);
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });

  it("marks scheduled meetings whose slot passed as not started", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    render(<MeetingStatusBadge meeting={makeMeeting({ scheduled_end_at: past })} />);
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("shows nothing for future scheduled meetings", () => {
    const { container } = render(<MeetingStatusBadge meeting={makeMeeting()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
