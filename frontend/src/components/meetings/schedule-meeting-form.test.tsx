import { fireEvent, screen, waitFor } from "@testing-library/react";

import { ApiError } from "@/lib/api/client";
import { makeMeeting, renderWithProviders } from "@/test/utils";

import { ScheduleMeetingForm } from "./schedule-meeting-form";

function setup(onSubmit = vi.fn().mockResolvedValue(makeMeeting())) {
  const onCancel = vi.fn();
  renderWithProviders(<ScheduleMeetingForm onSubmit={onSubmit} onCancel={onCancel} />);
  return { onSubmit, onCancel };
}

describe("ScheduleMeetingForm", () => {
  it("starts with Zoom's defaults", () => {
    setup();
    expect(screen.getByLabelText(/Topic/)).toHaveValue("My Meeting");
    expect(screen.getByLabelText("Duration")).toHaveValue("30");
    expect((screen.getByLabelText("Time Zone") as HTMLInputElement).value).toMatch(/^\(GMT/);
  });

  it("offers only the allowed durations", () => {
    setup();
    const options = Array.from((screen.getByLabelText("Duration") as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(["15", "30", "45", "60", "90", "120"]);
  });

  it("requires a topic", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/Topic/), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Topic is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not allow dates in the past", () => {
    setup();
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(screen.getByLabelText("Date")).toHaveAttribute("min", expected);
  });

  it("rejects a time earlier today", async () => {
    const { onSubmit } = setup();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const value = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    fireEvent.change(screen.getByLabelText("Date"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Please choose a time in the future.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a UTC timestamp with the chosen values", async () => {
    const { onSubmit } = setup();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    fireEvent.change(screen.getByLabelText(/Topic/), { target: { value: "  Design Review " } });
    fireEvent.click(screen.getByRole("button", { name: /Add Description/ }));
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Agenda" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: date } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "2:30" } });
    fireEvent.change(screen.getByLabelText("AM or PM"), { target: { value: "PM" } });
    fireEvent.change(screen.getByLabelText("Duration"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const input = onSubmit.mock.calls[0][0];
    expect(input).toMatchObject({ title: "Design Review", description: "Agenda", duration_minutes: 90 });
    expect(input.scheduled_at).toMatch(/Z$/);

    const sent = new Date(input.scheduled_at);
    expect(sent.getHours()).toBe(14);
    expect(sent.getMinutes()).toBe(30);
    expect(sent.getDate()).toBe(tomorrow.getDate());
  });

  it("shows server-side validation errors next to the field", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(400, "VALIDATION_ERROR", "Title must not contain HTML tags", [
          { field: "title", message: "Title must not contain HTML tags" },
        ]),
      );
    setup(onSubmit);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title must not contain HTML tags")).toBeInTheDocument();
    expect(screen.getByLabelText(/Topic/)).toHaveAttribute("aria-invalid", "true");
  });

  it("cancels", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
