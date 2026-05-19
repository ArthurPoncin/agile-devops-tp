import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteListingDialog } from "./delete-listing-dialog";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";

describe("<DeleteListingDialog>", () => {
  it("renders a 'Supprimer' trigger button", () => {
    render(<DeleteListingDialog listingId={LISTING_ID} action={vi.fn()} />);
    expect(screen.getByRole("button", { name: /supprimer/i })).toBeInTheDocument();
  });

  it("opens a confirmation dialog when the trigger is clicked", async () => {
    render(<DeleteListingDialog listingId={LISTING_ID} action={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /supprimer/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/confirmer la suppression/i)).toBeInTheDocument();
  });

  it("submits the listing id to the action when confirming", async () => {
    const action = vi.fn();
    render(<DeleteListingDialog listingId={LISTING_ID} action={action} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^supprimer$/i }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("id")).toBe(LISTING_ID);
  });

  it("does not call the action when the user cancels", async () => {
    const action = vi.fn();
    render(<DeleteListingDialog listingId={LISTING_ID} action={action} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /annuler/i }));

    expect(action).not.toHaveBeenCalled();
  });
});
