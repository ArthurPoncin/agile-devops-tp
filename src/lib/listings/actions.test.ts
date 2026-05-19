import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const insert = vi.fn();
const from = vi.fn();
const upload = vi.fn();
const storageFrom = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

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

beforeEach(() => {
  getUser.mockReset();
  insert.mockReset();
  from.mockReset();
  upload.mockReset();
  storageFrom.mockReset();
  redirect.mockClear();

  from.mockImplementation(() => ({ insert }));
  storageFrom.mockImplementation(() => ({ upload }));
  insert.mockResolvedValue({ error: null });
  upload.mockResolvedValue({ data: { path: "stub" }, error: null });
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
});
