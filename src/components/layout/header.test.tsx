import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

beforeEach(() => {
  getUser.mockReset();
});

describe("<Header>", () => {
  it("shows a link to /login when no user is signed in", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { Header } = await import("./header");

    render(await Header());

    const loginLink = screen.getByRole("link", { name: /se connecter/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows the user's email and a logout button when signed in", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    const { Header } = await import("./header");

    render(await Header());

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /se connecter/i })).not.toBeInTheDocument();
  });
});
