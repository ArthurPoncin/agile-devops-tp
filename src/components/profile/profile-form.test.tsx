import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "./profile-form";

const initialProfile = {
  full_name: "Alice Martin",
  email: "alice@example.com",
  phone: "0612345678",
};

describe("<ProfileForm>", () => {
  it("submits the full_name, email and phone to the provided action", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, emailChangePending: false });
    render(<ProfileForm initialProfile={initialProfile} action={action} />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/nom complet/i));
    await user.type(screen.getByLabelText(/nom complet/i), "Alice Dupont");
    await user.clear(screen.getByLabelText(/téléphone/i));
    await user.type(screen.getByLabelText(/téléphone/i), "0700000000");
    await user.click(
      screen.getByRole("button", { name: /enregistrer les modifications/i }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("full_name")).toBe("Alice Dupont");
    expect(formData.get("email")).toBe("alice@example.com");
    expect(formData.get("phone")).toBe("0700000000");
  });

  it("displays a success message after a successful update", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, emailChangePending: false });
    render(<ProfileForm initialProfile={initialProfile} action={action} />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /enregistrer les modifications/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/profil mis à jour/i);
    });
  });

  it("displays a pending-email notice when the email change is pending confirmation", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, emailChangePending: true });
    render(<ProfileForm initialProfile={initialProfile} action={action} />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /enregistrer les modifications/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/confirmez la modification d'email/i);
    });
  });

  it("displays the error returned by the action", async () => {
    const action = vi.fn().mockResolvedValue({ error: "Impossible de mettre à jour le profil." });
    render(<ProfileForm initialProfile={initialProfile} action={action} />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /enregistrer les modifications/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Impossible de mettre à jour le profil.",
      );
    });
  });
});
