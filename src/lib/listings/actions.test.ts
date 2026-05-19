import { beforeEach, describe, expect, it, vi } from "vitest";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";

const select = vi.fn();
const eq = vi.fn(() => ({ select }));
const del = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ delete: del }));
const getUser = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from, auth: { getUser } })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

beforeEach(() => {
  select.mockReset();
  eq.mockReset();
  del.mockReset();
  from.mockReset();
  getUser.mockReset();
  revalidatePath.mockReset();
  eq.mockImplementation(() => ({ select }));
  del.mockImplementation(() => ({ eq }));
  from.mockImplementation(() => ({ delete: del }));
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  select.mockResolvedValue({ data: [{ id: LISTING_ID }], error: null });
});

describe("deleteListing()", () => {
  it("deletes the listing matching the submitted id and revalidates the listings page", async () => {
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", LISTING_ID);

    await deleteListing(formData);

    expect(from).toHaveBeenCalledWith("listings");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", LISTING_ID);
    expect(revalidatePath).toHaveBeenCalledWith("/mes-annonces");
  });

  it("rejects a malformed id without calling Supabase", async () => {
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", "not-a-uuid");

    const result = await deleteListing(formData);

    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Suppression impossible. Annonce introuvable." });
  });

  it("rejects when no user is authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", LISTING_ID);

    const result = await deleteListing(formData);

    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Suppression impossible. Vous devez être connecté." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error message when Supabase rejects the delete", async () => {
    select.mockResolvedValue({ data: null, error: { message: "RLS denied" } });
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", LISTING_ID);

    const result = await deleteListing(formData);

    expect(result).toEqual({ error: "Suppression impossible. Réessayez plus tard." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns 'introuvable' when no row is deleted (RLS silently denied)", async () => {
    select.mockResolvedValue({ data: [], error: null });
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", LISTING_ID);

    const result = await deleteListing(formData);

    expect(result).toEqual({ error: "Suppression impossible. Annonce introuvable." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
