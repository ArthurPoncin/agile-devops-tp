import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingForm } from "./listing-form";

describe("<ListingForm>", () => {
  it("submits every required field to the provided action", async () => {
    const action = vi.fn();
    render(<ListingForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/titre/i), "Bel appartement");
    await user.selectOptions(screen.getByLabelText(/type/i), "appartement");
    await user.type(screen.getByLabelText(/ville/i), "Nantes");
    await user.type(screen.getByLabelText(/surface/i), "65");
    await user.type(screen.getByLabelText(/nombre de pièces/i), "3");
    await user.type(screen.getByLabelText(/prix/i), "250000");
    await user.click(screen.getByRole("button", { name: /publier/i }));

    expect(action).toHaveBeenCalledTimes(1);
    const fd = action.mock.calls[0][0] as FormData;
    expect(fd.get("title")).toBe("Bel appartement");
    expect(fd.get("type")).toBe("appartement");
    expect(fd.get("city")).toBe("Nantes");
    expect(fd.get("surface")).toBe("65");
    expect(fd.get("rooms")).toBe("3");
    expect(fd.get("price")).toBe("250000");
  });

  it("renders a multi-file image picker named 'photos'", () => {
    render(<ListingForm action={vi.fn()} />);

    const photosInput = screen.getByLabelText(/photos/i) as HTMLInputElement;
    expect(photosInput.type).toBe("file");
    expect(photosInput.name).toBe("photos");
    expect(photosInput.multiple).toBe(true);
    expect(photosInput.accept).toBe("image/*");
  });

  it("displays the error message returned by the action", async () => {
    const action = vi.fn().mockResolvedValue({ error: "Champs invalides." });
    render(<ListingForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/titre/i), "Bel appartement");
    await user.selectOptions(screen.getByLabelText(/type/i), "appartement");
    await user.type(screen.getByLabelText(/ville/i), "Nantes");
    await user.type(screen.getByLabelText(/surface/i), "65");
    await user.type(screen.getByLabelText(/nombre de pièces/i), "3");
    await user.type(screen.getByLabelText(/prix/i), "250000");
    await user.click(screen.getByRole("button", { name: /publier/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Champs invalides.");
    });
  });
});
