import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";
const BLOB_BASE = "https://rwjv07fuxbtccnji.private.blob.vercel-storage.com";

const getUser = vi.fn();
const insert = vi.fn();
const select = vi.fn();
const eq = vi.fn(() => ({ select }));
const del = vi.fn(() => ({ eq }));
const from = vi.fn();
const blobPut = vi.fn();
const blobDel = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const revalidatePath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

vi.mock("@vercel/blob", () => ({
  put: blobPut,
  del: blobDel,
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
  blobPut.mockReset();
  blobDel.mockReset();
  redirect.mockClear();
  revalidatePath.mockReset();

  eq.mockImplementation(() => ({ select }));
  del.mockImplementation(() => ({ eq }));
  from.mockImplementation(() => ({ insert, delete: del }));
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  insert.mockResolvedValue({ error: null });
  blobPut.mockResolvedValue({
    url: `${BLOB_BASE}/annonce/stub.jpg`,
    pathname: "annonce/stub.jpg",
    downloadUrl: `${BLOB_BASE}/annonce/stub.jpg`,
    contentType: "image/jpeg",
    contentDisposition: "inline",
  });
  blobDel.mockResolvedValue(undefined);
  select.mockResolvedValue({ data: [{ id: LISTING_ID }], error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function validFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("title", "Bel appartement");
  fd.set("type", "appartement");
  fd.set("city", "Nantes");
  fd.set("surface", "65");
  fd.set("rooms", "3");
  fd.set("price", "250000");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
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
    expect(blobPut).not.toHaveBeenCalled();
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
    expect(blobPut).not.toHaveBeenCalled();
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

  it("uploads each photo to the 'annonce/' folder in Vercel Blob and persists the URLs", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const url1 = `${BLOB_BASE}/annonce/first.jpg`;
    const url2 = `${BLOB_BASE}/annonce/second.png`;
    blobPut
      .mockResolvedValueOnce({ url: url1, pathname: "annonce/first.jpg", downloadUrl: url1, contentType: "image/jpeg", contentDisposition: "inline" })
      .mockResolvedValueOnce({ url: url2, pathname: "annonce/second.png", downloadUrl: url2, contentType: "image/png", contentDisposition: "inline" });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    const photo1 = new File(["bytes-1"], "front.jpg", { type: "image/jpeg" });
    const photo2 = new File(["bytes-2"], "back.png", { type: "image/png" });
    fd.append("photos", photo1);
    fd.append("photos", photo2);

    await expect(createListing(fd)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(blobPut).toHaveBeenCalledTimes(2);
    expect(blobPut.mock.calls[0][0]).toMatch(/^annonce\/.+\.jpg$/);
    expect(blobPut.mock.calls[0][1]).toBe(photo1);
    expect(blobPut.mock.calls[1][0]).toMatch(/^annonce\/.+\.png$/);
    expect(blobPut.mock.calls[1][1]).toBe(photo2);

    const insertedUrls = (insert.mock.calls[0][0] as { photos: string[] }).photos;
    expect(insertedUrls).toHaveLength(2);
    expect(insertedUrls[0]).toBe(url1);
    expect(insertedUrls[1]).toBe(url2);
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

    expect(blobPut).not.toHaveBeenCalled();
    expect((insert.mock.calls[0][0] as { photos: string[] }).photos).toEqual([]);
  });

  it("returns an error and does not insert when a photo upload fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    blobPut.mockRejectedValue(new Error("blob error"));
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
    expect(blobPut).not.toHaveBeenCalled();
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
    expect(blobPut).not.toHaveBeenCalled();
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
    expect(blobPut).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("deletes already-uploaded blobs when a later upload fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    const url1 = `${BLOB_BASE}/annonce/first.jpg`;
    blobPut
      .mockResolvedValueOnce({ url: url1, pathname: "annonce/first.jpg", downloadUrl: url1, contentType: "image/jpeg", contentDisposition: "inline" })
      .mockRejectedValueOnce(new Error("blob error"));
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["a"], "a.jpg", { type: "image/jpeg" }));
    fd.append("photos", new File(["b"], "b.jpg", { type: "image/jpeg" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Impossible d'envoyer les photos." });
    expect(blobDel).toHaveBeenCalledTimes(1);
    expect(blobDel).toHaveBeenCalledWith([url1], expect.any(Object));
    expect(insert).not.toHaveBeenCalled();
  });

  it("deletes uploaded blobs when the database insert fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-7" } },
      error: null,
    });
    insert.mockResolvedValue({ error: { message: "boom" } });
    const url1 = `${BLOB_BASE}/annonce/a.jpg`;
    const url2 = `${BLOB_BASE}/annonce/b.png`;
    blobPut
      .mockResolvedValueOnce({ url: url1, pathname: "annonce/a.jpg", downloadUrl: url1, contentType: "image/jpeg", contentDisposition: "inline" })
      .mockResolvedValueOnce({ url: url2, pathname: "annonce/b.png", downloadUrl: url2, contentType: "image/png", contentDisposition: "inline" });
    const { createListing } = await import("./actions");

    const fd = validFormData();
    fd.append("photos", new File(["a"], "a.jpg", { type: "image/jpeg" }));
    fd.append("photos", new File(["b"], "b.png", { type: "image/png" }));

    const result = await createListing(fd);

    expect(result).toEqual({ error: "Impossible de créer l'annonce." });
    expect(blobDel).toHaveBeenCalledTimes(1);
    expect(blobDel).toHaveBeenCalledWith([url1, url2], expect.any(Object));
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
