import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getProfile = vi.fn();
const redirect = vi.fn<(path: string) => never>();

vi.mock("@/lib/profile/actions", () => ({
  getProfile: (...args: unknown[]) => getProfile(...args),
  updateProfile: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

beforeEach(() => {
  getProfile.mockReset();
  redirect.mockReset();
  redirect.mockImplementation((path) => {
    throw new Error(`__REDIRECT__:${path}`);
  });
});

describe("ProfilePage", () => {
  it("redirects to /login when no profile is available", async () => {
    getProfile.mockResolvedValue(null);
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("__REDIRECT__:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the profile form pre-filled with the user's data", async () => {
    getProfile.mockResolvedValue({
      full_name: "Alice Martin",
      email: "alice@example.com",
      phone: "0612345678",
    });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("heading", { name: /mon profil/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nom complet/i)).toHaveValue("Alice Martin");
    expect(screen.getByLabelText(/email/i)).toHaveValue("alice@example.com");
    expect(screen.getByLabelText(/téléphone/i)).toHaveValue("0612345678");
    expect(
      screen.getByRole("button", { name: /enregistrer les modifications/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se déconnecter/i }),
    ).toBeInTheDocument();
  });
});
