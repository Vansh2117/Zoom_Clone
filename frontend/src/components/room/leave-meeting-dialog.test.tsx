import { fireEvent, render, screen } from "@testing-library/react";

import { LeaveMeetingDialog } from "./leave-meeting-dialog";

function setup(isHost: boolean) {
  const handlers = { onOpenChange: vi.fn(), onLeave: vi.fn(), onEndForAll: vi.fn() };
  render(<LeaveMeetingDialog open isHost={isHost} pending={false} {...handlers} />);
  return handlers;
}

describe("LeaveMeetingDialog", () => {
  it("asks guests to confirm before leaving", () => {
    const { onLeave } = setup(false);

    expect(screen.getByRole("dialog", { name: "Are you sure you want to leave this meeting?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End Meeting for All" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Leave Meeting" }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("offers the host both End for All and Leave", () => {
    const { onEndForAll, onLeave } = setup(true);

    fireEvent.click(screen.getByRole("button", { name: "End Meeting for All" }));
    expect(onEndForAll).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Leave Meeting" }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("cancel keeps the user in the meeting", () => {
    const { onOpenChange, onLeave } = setup(false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("closes with the Escape key", () => {
    const { onOpenChange } = setup(false);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
