import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HomePage", () => {
  it("redirects authenticated users to /annonces", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/annonces");
  });

  it("redirects anonymous users to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
