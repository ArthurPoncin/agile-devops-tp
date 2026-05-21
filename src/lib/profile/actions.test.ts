import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const single = vi.fn();
const update = vi.fn();
const updateEq = vi.fn();
const from = vi.fn();
const updateUser = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser, updateUser },
    from,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

beforeEach(() => {
  getUser.mockReset();
  select.mockReset();
  eq.mockReset();
  single.mockReset();
  update.mockReset();
  updateEq.mockReset();
  from.mockReset();
  updateUser.mockReset();
  revalidatePath.mockReset();

  single.mockResolvedValue({
    data: { full_name: "Alice Martin", phone: "0612345678" },
    error: null,
  });
  eq.mockImplementation(() => ({ single }));
  select.mockImplementation(() => ({ eq }));
  updateEq.mockResolvedValue({ error: null });
  update.mockImplementation(() => ({ eq: updateEq }));
  from.mockImplementation(() => ({ select, update }));
  getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "alice@example.com" } },
    error: null,
  });
  updateUser.mockResolvedValue({ data: { user: null }, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function validFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("full_name", "Alice Martin");
  fd.set("email", "alice@example.com");
  fd.set("phone", "0612345678");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

describe("getProfile()", () => {
  it("returns null when no user is authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { getProfile } = await import("./actions");

    const result = await getProfile();

    expect(result).toBeNull();
  });

  it("returns profile data including the user email", async () => {
    const { getProfile } = await import("./actions");

    const result = await getProfile();

    expect(result).toEqual({
      full_name: "Alice Martin",
      email: "alice@example.com",
      phone: "0612345678",
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns empty strings when profile row has null fields", async () => {
    single.mockResolvedValue({
      data: { full_name: null, phone: null },
      error: null,
    });
    const { getProfile } = await import("./actions");

    const result = await getProfile();

    expect(result).toEqual({
      full_name: "",
      email: "alice@example.com",
      phone: "",
    });
  });

  it("returns null when the profile row cannot be fetched", async () => {
    single.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { getProfile } = await import("./actions");

    const result = await getProfile();

    expect(result).toBeNull();
  });
});

describe("updateProfile()", () => {
  it("returns an error when no user is authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(validFormData());

    expect(result).toEqual({
      error: "Vous devez être connecté pour modifier votre profil.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid email", async () => {
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(validFormData({ email: "not-an-email" }));

    expect("error" in result).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty full_name", async () => {
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(validFormData({ full_name: "" }));

    expect("error" in result).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates full_name and phone in profiles for a valid input", async () => {
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(validFormData());

    expect(result).toEqual({ ok: true, emailChangePending: false });
    expect(update).toHaveBeenCalledWith({
      full_name: "Alice Martin",
      phone: "0612345678",
    });
    expect(updateEq).toHaveBeenCalledWith("id", "user-1");
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("stores null for an empty phone", async () => {
    const { updateProfile } = await import("./actions");

    await updateProfile(validFormData({ phone: "" }));

    expect(update).toHaveBeenCalledWith({
      full_name: "Alice Martin",
      phone: null,
    });
  });

  it("does not call auth.updateUser when the email did not change", async () => {
    const { updateProfile } = await import("./actions");

    await updateProfile(validFormData());

    expect(updateUser).not.toHaveBeenCalled();
  });

  it("calls auth.updateUser when the email changed and reports emailChangePending", async () => {
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(
      validFormData({ email: "alice2@example.com" }),
    );

    expect(updateUser).toHaveBeenCalledWith({ email: "alice2@example.com" });
    expect(result).toEqual({ ok: true, emailChangePending: true });
  });

  it("returns an error when the profile update fails", async () => {
    updateEq.mockResolvedValue({ error: { message: "boom" } });
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(validFormData());

    expect(result).toEqual({ error: "Impossible de mettre à jour le profil." });
  });

  it("returns an error when the auth email update fails", async () => {
    updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "rate limited" },
    });
    const { updateProfile } = await import("./actions");

    const result = await updateProfile(
      validFormData({ email: "alice2@example.com" }),
    );

    expect(result).toEqual({
      error:
        "Nom et téléphone enregistrés, mais impossible de mettre à jour l'email. Réessayez plus tard.",
    });
  });
});
