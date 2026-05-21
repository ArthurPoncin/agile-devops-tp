import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const signUp = vi.fn();
const redirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signOut, signUp },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

beforeEach(() => {
  signInWithPassword.mockReset();
  signOut.mockReset();
  signUp.mockReset();
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

describe("signup()", () => {
  it("signs the user up with email/password + name in options.data and redirects home on success", async () => {
    signUp.mockResolvedValue({ error: null });
    const { signup } = await import("./actions");

    const formData = new FormData();
    formData.set("name", "Alice Martin");
    formData.set("email", "alice@example.com");
    formData.set("password", "secret12");
    formData.set("confirmPassword", "secret12");

    await signup(formData);

    expect(signUp).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "secret12",
      options: { data: { full_name: "Alice Martin" } },
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("rejects malformed input without calling Supabase", async () => {
    const { signup } = await import("./actions");

    const formData = new FormData();
    formData.set("name", "");
    formData.set("email", "not-an-email");
    formData.set("password", "abc");
    formData.set("confirmPassword", "xyz");

    const result = await signup(formData);

    expect(signUp).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Inscription invalide. Vérifiez les champs du formulaire." });
  });

  it("returns an error and does not redirect when Supabase rejects the signup", async () => {
    signUp.mockResolvedValue({
      error: { message: "User already registered" },
    });
    const { signup } = await import("./actions");

    const formData = new FormData();
    formData.set("name", "Alice Martin");
    formData.set("email", "alice@example.com");
    formData.set("password", "secret12");
    formData.set("confirmPassword", "secret12");

    const result = await signup(formData);

    expect(result).toEqual({ error: "Inscription impossible. Cet email est peut-être déjà utilisé." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
