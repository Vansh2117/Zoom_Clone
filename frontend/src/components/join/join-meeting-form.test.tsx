import { fireEvent, screen, waitFor } from "@testing-library/react";

import { mockRouter } from "@/test/router";
import { callsTo, errorResponse, jsonResponse, makeMeeting, mockApi, renderWithProviders } from "@/test/utils";

import { JoinMeetingForm } from "./join-meeting-form";

function typeAndSubmit(value: string) {
  fireEvent.change(screen.getByLabelText("Meeting ID or Invite Link"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Join" }));
}

describe("JoinMeetingForm", () => {
  it("keeps Join disabled until something is typed", () => {
    mockApi({});
    renderWithProviders(<JoinMeetingForm />);
    expect(screen.getByRole("button", { name: "Join" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Meeting ID or Invite Link"), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: "Join" })).toBeEnabled();
  });

  it("validates the format locally without calling the API", async () => {
    const fetchMock = mockApi({});
    renderWithProviders(<JoinMeetingForm />);

    typeAndSubmit("12345");

    expect(await screen.findByRole("alert")).toHaveTextContent("A meeting ID has 9 to 11 digits.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the meeting does not exist", async () => {
    mockApi({ "GET /meetings/9999999999": () => errorResponse(404, "MEETING_NOT_FOUND", "not found") });
    renderWithProviders(<JoinMeetingForm />);

    typeAndSubmit("999 999 9999");

    expect(await screen.findByRole("alert")).toHaveTextContent("This meeting ID is not valid");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("refuses meetings that have ended", async () => {
    mockApi({ "GET /meetings/8272914420": () => jsonResponse(makeMeeting({ status: "ended" })) });
    renderWithProviders(<JoinMeetingForm />);

    typeAndSubmit("8272914420");

    expect(await screen.findByRole("alert")).toHaveTextContent("ended by the host");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("goes to the pre-join screen for a valid invite link", async () => {
    const fetchMock = mockApi({ "GET /meetings/8272914420": () => jsonResponse(makeMeeting()) });
    renderWithProviders(<JoinMeetingForm />);

    typeAndSubmit("https://example.com/j/8272914420");

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/j/8272914420"));
    expect(callsTo(fetchMock, "GET /meetings/8272914420")).toHaveLength(1);
  });

  it("explains when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    renderWithProviders(<JoinMeetingForm />);

    typeAndSubmit("8272914420");

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't connect to the server");
  });
});
