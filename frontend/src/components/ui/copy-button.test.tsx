import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "@/test/utils";

import { CopyButton } from "./copy-button";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

describe("CopyButton", () => {
  afterEach(() => setClipboard(undefined));

  it("copies with the Clipboard API and confirms with a toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderWithProviders(<CopyButton text="http://localhost:3000/j/8272914420" label="Copy link" successMessage="Invite link copied" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("http://localhost:3000/j/8272914420"));
    expect(await screen.findByText("Invite link copied")).toBeInTheDocument();
  });

  it("falls back to a read-only field when the Clipboard API is unavailable", async () => {
    setClipboard(undefined);
    renderWithProviders(<CopyButton text="http://localhost:3000/j/8272914420" label="Copy link" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    const field = await screen.findByLabelText("Text to copy");
    expect(field).toHaveValue("http://localhost:3000/j/8272914420");
    expect(field).toHaveAttribute("readonly");
  });

  it("falls back when the browser denies clipboard access", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) });
    renderWithProviders(<CopyButton iconOnly text="3297597040" label="Copy Personal Meeting ID" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy Personal Meeting ID" }));

    expect(await screen.findByLabelText("Text to copy")).toHaveValue("3297597040");
  });
});
