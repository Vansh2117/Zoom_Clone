import { screen } from "@testing-library/react";

import { defaultUser, jsonResponse, mockApi, renderWithProviders } from "@/test/utils";

import { ProfileDetails } from "./profile-details";

describe("ProfileDetails", () => {
  it("shows the logged-in user's name, email and Personal Meeting ID", async () => {
    mockApi({ "GET /me": () => jsonResponse(defaultUser) });
    renderWithProviders(<ProfileDetails />);

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getAllByText(defaultUser.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(defaultUser.email).length).toBeGreaterThan(0);
    expect(screen.getByText("329 759 7040")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Personal Meeting ID" })).toBeInTheDocument();
  });

  it("shows a retryable error when the backend is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    renderWithProviders(<ProfileDetails />);

    expect(await screen.findByText("Couldn't load this")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
