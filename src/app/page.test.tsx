import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const eq = vi.fn();
const order = vi.fn();
const limit = vi.fn();
const select = vi.fn();
const from = vi.fn();
const getUser = vi.fn();

const builder = { eq, order, limit };
eq.mockReturnValue(builder);
order.mockReturnValue(builder);
select.mockReturnValue(builder);
from.mockReturnValue({ select });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from,
    auth: { getUser },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  eq.mockReturnValue(builder);
  order.mockReturnValue(builder);
  select.mockReturnValue(builder);
  from.mockReturnValue({ select });
  getUser.mockResolvedValue({ data: { user: null } });
  limit.mockResolvedValue({ data: [], error: null });
});

describe("HomePage", () => {
  it("redirects authenticated users to /annonces", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/annonces");
  });

  it("renders the hero section with both CTAs for anonymous users", async () => {
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Trouvez le bien");
    const voirLink = screen.getByRole("link", { name: /voir les annonces/i });
    expect(voirLink).toHaveAttribute("href", "/annonces");
    const deposerLink = screen.getByRole("link", { name: /déposer une annonce/i });
    expect(deposerLink).toHaveAttribute("href", "/login");
  });

  it("renders the signup CTA at the bottom", async () => {
    const { default: Page } = await import("./page");

    render(await Page());

    const signupLink = screen.getByRole("link", { name: /créer un compte/i });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("displays the latest listings when data is available", async () => {
    limit.mockResolvedValue({
      data: [
        { id: "1", title: "Maison Nantes", city: "Nantes", price: 250000, surface: 90, photos: [], description: null },
        { id: "2", title: "Appart Paris", city: "Paris", price: 400000, surface: 55, photos: [], description: null },
      ],
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByText("Maison Nantes")).toBeInTheDocument();
    expect(screen.getByText("Appart Paris")).toBeInTheDocument();
  });

  it("displays empty state when no listings exist", async () => {
    limit.mockResolvedValue({ data: [], error: null });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByText(/aucune annonce disponible/i)).toBeInTheDocument();
  });

  it("displays an error message when the Supabase query fails", async () => {
    limit.mockResolvedValue({ data: null, error: { message: "connection failed" } });
    const { default: Page } = await import("./page");

    render(await Page());

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/impossible de charger les annonces/i);
    expect(screen.queryByText(/aucune annonce disponible/i)).not.toBeInTheDocument();
  });

  it("renders the features section", async () => {
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByText("Recherche avancée")).toBeInTheDocument();
    expect(screen.getByText("Annonces vérifiées")).toBeInTheDocument();
    expect(screen.getByText("Partout en France")).toBeInTheDocument();
  });
});
