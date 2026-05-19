import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./signup-form";

describe("<SignupForm>", () => {
  it("submits the name, email, password and confirmation to the provided action", async () => {
    const action = vi.fn();
    render(<SignupForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nom/i), "Alice Martin");
    await user.type(screen.getByLabelText(/^email$/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "secret12");
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), "secret12");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("name")).toBe("Alice Martin");
    expect(formData.get("email")).toBe("alice@example.com");
    expect(formData.get("password")).toBe("secret12");
    expect(formData.get("confirmPassword")).toBe("secret12");
  });

  it("displays the error message returned by the action", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ error: "Inscription impossible. Cet email est peut-être déjà utilisé." });
    render(<SignupForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nom/i), "Alice Martin");
    await user.type(screen.getByLabelText(/^email$/i), "taken@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "secret12");
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), "secret12");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Inscription impossible. Cet email est peut-être déjà utilisé.",
      );
    });
  });
});
