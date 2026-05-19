import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const redirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signOut },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

beforeEach(() => {
  signInWithPassword.mockReset();
  signOut.mockReset();
  redirect.mockReset();
});

describe("login()", () => {
  it("signs in with the submitted email/password and redirects home on success", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const { login } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "alice@example.com");
    formData.set("password", "s3cret!");

    await login(formData);

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "s3cret!",
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("rejects malformed input without calling Supabase", async () => {
    const { login } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "");

    const result = await login(formData);

    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Email ou mot de passe incorrect." });
  });

  it("returns an error message and does not redirect when Supabase rejects credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const { login } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "alice@example.com");
    formData.set("password", "wrong");

    const result = await login(formData);

    expect(result).toEqual({ error: "Email ou mot de passe incorrect." });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("logout()", () => {
  it("signs out and redirects to /login", async () => {
    signOut.mockResolvedValue({ error: null });
    const { logout } = await import("./actions");

    await logout();

    expect(signOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
