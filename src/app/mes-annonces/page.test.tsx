import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getUser = vi.fn();
const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const redirect = vi.fn<(path: string) => never>();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

beforeEach(() => {
  getUser.mockReset();
  order.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
  redirect.mockReset();
  redirect.mockImplementation((path) => {
    throw new Error(`__REDIRECT__:${path}`);
  });
});

describe("MesAnnoncesPage", () => {
  it("redirects to /login when no user is signed in", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("__REDIRECT__:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(from).not.toHaveBeenCalled();
  });

  it("renders an empty-state message when the user has no listings", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    order.mockResolvedValue({ data: [], error: null });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("heading", { name: /mes annonces/i })).toBeInTheDocument();
    expect(
      screen.getByText(/vous n.avez pas encore publié d.annonce/i),
    ).toBeInTheDocument();
  });

  it("renders an error message when the Supabase query fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    order.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("alert")).toHaveTextContent(
      /impossible de charger vos annonces/i,
    );
    expect(
      screen.queryByText(/vous n'avez pas encore publié d'annonce/i),
    ).not.toBeInTheDocument();
  });

  it("queries listings scoped to the current user, ordered by created_at desc, and renders them", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    order.mockResolvedValue({
      data: [
        {
          id: "l1",
          title: "Maison à Nantes",
          status: "active",
          created_at: "2025-03-15T12:00:00Z",
        },
        {
          id: "l2",
          title: "Studio archivé",
          status: "archived",
          created_at: "2025-01-02T08:00:00Z",
        },
      ],
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(from).toHaveBeenCalledWith("listings");
    expect(eq).toHaveBeenCalledWith("owner_id", "u1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });

    expect(screen.getByText("Maison à Nantes")).toBeInTheDocument();
    expect(screen.getByText("Studio archivé")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Archivée")).toBeInTheDocument();
    expect(
      screen.queryByText(/vous n'avez pas encore publié d'annonce/i),
    ).not.toBeInTheDocument();
  });
});
