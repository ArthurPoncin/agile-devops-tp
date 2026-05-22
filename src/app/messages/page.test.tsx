import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getUser = vi.fn();
const overrideTypes = vi.fn();
const order = vi.fn(() => ({ overrideTypes }));
const select = vi.fn(() => ({ order }));
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
  overrideTypes.mockReset();
  order.mockClear();
  select.mockClear();
  from.mockClear();
  redirect.mockReset();
  redirect.mockImplementation((path) => {
    throw new Error(`__REDIRECT__:${path}`);
  });
});

describe("MessagesPage", () => {
  it("redirects to /login when no user is signed in", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("__REDIRECT__:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(from).not.toHaveBeenCalled();
  });

  it("renders an empty-state message when the user has no messages", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    overrideTypes.mockResolvedValue({ data: [], error: null });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("heading", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByText(/aucun message reçu/i)).toBeInTheDocument();
  });

  it("renders an error message when the Supabase query fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    overrideTypes.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(screen.getByRole("alert")).toHaveTextContent(
      /impossible de charger vos messages/i,
    );
    expect(screen.queryByText(/aucun message reçu/i)).not.toBeInTheDocument();
  });

  it("queries messages ordered by created_at desc and renders each with content, listing title and buyer contact", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    overrideTypes.mockResolvedValue({
      data: [
        {
          id: "m1",
          content: "Bonjour, votre maison est-elle toujours disponible ?",
          buyer_name: "Bob Dupont",
          buyer_email: "bob@example.com",
          created_at: "2026-04-10T09:30:00Z",
          listings: { title: "Maison à Nantes" },
        },
        {
          id: "m2",
          content: "Je suis intéressée par votre studio.",
          buyer_name: "Camille Martin",
          buyer_email: "camille@example.com",
          created_at: "2026-04-05T18:00:00Z",
          listings: { title: "Studio Centre-ville" },
        },
      ],
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page());

    expect(from).toHaveBeenCalledWith("messages");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });

    expect(
      screen.getByText("Bonjour, votre maison est-elle toujours disponible ?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Maison à Nantes")).toBeInTheDocument();
    expect(screen.getByText("Bob Dupont")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();

    expect(
      screen.getByText("Je suis intéressée par votre studio."),
    ).toBeInTheDocument();
    expect(screen.getByText("Studio Centre-ville")).toBeInTheDocument();
    expect(screen.getByText("Camille Martin")).toBeInTheDocument();
    expect(screen.getByText("camille@example.com")).toBeInTheDocument();

    expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    expect(screen.getByText("05/04/2026")).toBeInTheDocument();

    expect(screen.queryByText(/aucun message reçu/i)).not.toBeInTheDocument();
  });
});
