import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

describe("<LoginForm>", () => {
  it("submits the email and password to the provided action", async () => {
    const action = vi.fn();
    render(<LoginForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/mot de passe/i), "s3cret!");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("alice@example.com");
    expect(formData.get("password")).toBe("s3cret!");
  });

  it("displays the error message returned by the action", async () => {
    const action = vi.fn().mockResolvedValue({ error: "Email ou mot de passe incorrect." });
    render(<LoginForm action={action} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/mot de passe/i), "wrong");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Email ou mot de passe incorrect.");
    });
  });
});
