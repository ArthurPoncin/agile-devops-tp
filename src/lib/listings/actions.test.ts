import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";

const getUser = vi.fn();
const insert = vi.fn();
const select = vi.fn();
const eq = vi.fn(() => ({ select }));
const del = vi.fn(() => ({ eq }));
const from = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const storageFrom = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
    storage: { from: storageFrom },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

beforeEach(() => {
  getUser.mockReset();
  insert.mockReset();
  select.mockReset();
  eq.mockReset();
  del.mockReset();
  from.mockReset();
  upload.mockReset();
  remove.mockReset();
  storageFrom.mockReset();
  redirect.mockClear();
  revalidatePath.mockReset();

  eq.mockImplementation(() => ({ select }));
  del.mockImplementation(() => ({ eq }));
  from.mockImplementation(() => ({ insert, delete: del }));
  storageFrom.mockImplementation(() => ({ upload, remove }));
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  insert.mockResolvedValue({ error: null });
  upload.mockResolvedValue({ data: { path: "stub" }, error: null });
  remove.mockResolvedValue({ data: [], error: null });
  select.mockResolvedValue({ data: [{ id: LISTING_ID }], error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function validFormData(overrides: Partial<Record<string, string>> = {}) {
  const fd = new FormData();
  fd.set("title", "Bel appartement");
  fd.set("type", "appartement");
  fd.set("city", "Nantes");
  fd.set("surface", "65");
  fd.set("rooms", "3");
  fd.set("price", "250000");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v as string);
  }
  return fd;
}

describe("createListing()", () => {
  it("redirects to /login when no user is authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { createListing } = await import("./actions");

    await expect(createListing(validFormData())).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(insert).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns a validation error and does not touch the database when fields are invalid", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const result = await createListing(validFormData({ title: "", surface: "-5" }));

    expect(result).toEqual({ error: "Champs invalides." });
    expect(insert).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("inserts the listing with owner_id from auth and default status 'active', then redirects home", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-42" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    await expect(createListing(validFormData())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(from).toHaveBeenCalledWith("listings");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      owner_id: "user-42",
      title: "Bel appartement",
      type: "appartement",
      city: "Nantes",
      surface: 65,
      rooms: 3,
      price: 250000,
      photos: [],
      status: "active",
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("returns an error and does not redirect when the database insert fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-42" } },
      error: null,
    });
    insert.mockResolvedValue({ error: { message: "boom" } });
    const { createListing } = await import("./actions");

    const result = await createListing(validFormData());

    expect(result).toEqual({ error: "Impossible de créer l'annonce." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("uploads each photo into the user's folder of the 'listings' bucket and persists the paths", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    const photo1 = new File(["bytes-1"], "front.jpg", { type: "image/jpeg" });
    const photo2 = new File(["bytes-2"], "back.png", { type: "image/png" });
    fd.append("photos", photo1);
    fd.append("photos", photo2);

    await expect(createListing(fd)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(storageFrom).toHaveBeenCalledWith("listings");
    expect(upload).toHaveBeenCalledTimes(2);

    const firstCall = upload.mock.calls[0];
    const secondCall = upload.mock.calls[1];
    expect(firstCall[0]).toMatch(/^user-7\/.+\.jpg$/);
    expect(firstCall[1]).toBe(photo1);
    expect(secondCall[0]).toMatch(/^user-7\/.+\.png$/);
    expect(secondCall[1]).toBe(photo2);

    const insertedPaths = (insert.mock.calls[0][0] as { photos: string[] }).photos;
    expect(insertedPaths).toHaveLength(2);
    expect(insertedPaths[0]).toBe(firstCall[0]);
    expect(insertedPaths[1]).toBe(secondCall[0]);
  });

  it("skips empty file entries (browsers send empty File when no file is selected)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File([], "", { type: "application/octet-stream" }));

    await expect(createListing(fd)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(upload).not.toHaveBeenCalled();
    expect((insert.mock.calls[0][0] as { photos: string[] }).photos).toEqual([]);
  });

  it("returns an error and does not insert when a photo upload fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    upload.mockResolvedValue({ data: null, error: { message: "storage boom" } });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["bytes"], "front.jpg", { type: "image/jpeg" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Impossible d'envoyer les photos." });
    expect(insert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects non-image files server-side", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["pdf-bytes"], "doc.pdf", { type: "application/pdf" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Format de photo invalide." });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects photos larger than 5 MB", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const tooBig = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    const fd = validFormData();
    fd.append("photos", tooBig);

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Photo trop volumineuse (max 5 Mo)." });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects more than 10 photos", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    for (let i = 0; i < 11; i++) {
      fd.append("photos", new File(["x"], `p${i}.jpg`, { type: "image/jpeg" }));
    }

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Maximum 10 photos." });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("removes already-uploaded photos when a later upload fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    upload
      .mockResolvedValueOnce({ data: { path: "ok" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["a"], "a.jpg", { type: "image/jpeg" }));
    fd.append("photos", new File(["b"], "b.jpg", { type: "image/jpeg" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Impossible d'envoyer les photos." });
    expect(remove).toHaveBeenCalledTimes(1);
    const removedPaths = remove.mock.calls[0][0] as string[];
    expect(removedPaths).toHaveLength(1);
    expect(removedPaths[0]).toMatch(/^user-7\/.+\.jpg$/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("removes uploaded photos when the database insert fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    insert.mockResolvedValue({ error: { message: "boom" } });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["a"], "a.jpg", { type: "image/jpeg" }));
    fd.append("photos", new File(["b"], "b.png", { type: "image/png" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Impossible de créer l'annonce." });
    expect(remove).toHaveBeenCalledTimes(1);
    const removedPaths = remove.mock.calls[0][0] as string[];
    expect(removedPaths).toHaveLength(2);
  });
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
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { deleteListing } = await import("./actions");

    const formData = new FormData();
    formData.set("id", LISTING_ID);

    const result = await deleteListing(formData);

    expect(del).not.toHaveBeenCalled();
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
