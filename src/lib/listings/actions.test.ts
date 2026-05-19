import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
const del = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ delete: del }));
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

beforeEach(() => {
  eq.mockReset();
  del.mockReset();
  from.mockReset();
  revalidatePath.mockReset();
  del.mockImplementation(() => ({ eq }));
  from.mockImplementation(() => ({ delete: del }));
  eq.mockResolvedValue({ error: null });
});

describe("deleteListing()", () => {
  it("deletes the listing matching the submitted id", async () => {
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", "11111111-1111-4111-8111-111111111111");

    await deleteListing(formData);

    expect(from).toHaveBeenCalledWith("listings");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
  });

  it("rejects a malformed id without calling Supabase", async () => {
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", "not-a-uuid");

    const result = await deleteListing(formData);

    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Suppression impossible. Annonce introuvable." });
  });

  it("returns an error message when Supabase rejects the delete", async () => {
    eq.mockResolvedValue({ error: { message: "RLS denied" } });
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", "11111111-1111-4111-8111-111111111111");

    const result = await deleteListing(formData);

    expect(result).toEqual({ error: "Suppression impossible. Réessayez plus tard." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
