import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_ID = "22222222-2222-4222-8222-222222222222";

const listingSingle = vi.fn();
const profileSingle = vi.fn();
const listingEq = vi.fn(() => ({ single: listingSingle }));
const profileEq = vi.fn(() => ({ single: profileSingle }));
const listingSelect = vi.fn(() => ({ eq: listingEq }));
const profileSelect = vi.fn(() => ({ eq: profileEq }));
const from = vi.fn((table: string) => {
  if (table === "listings") return { select: listingSelect };
  if (table === "profiles") return { select: profileSelect };
  return {};
});

const getPublicUrl = vi.fn();
const storageFrom = vi.fn(() => ({ getPublicUrl }));

const notFound = vi.fn<() => never>();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from,
    storage: { from: storageFrom },
  })),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

beforeEach(() => {
  listingSingle.mockReset();
  profileSingle.mockReset();
  listingEq.mockClear();
  profileEq.mockClear();
  listingSelect.mockClear();
  profileSelect.mockClear();
  from.mockClear();
  getPublicUrl.mockReset();
  storageFrom.mockClear();
  notFound.mockReset();
  notFound.mockImplementation(() => {
    throw new Error("__NOT_FOUND__");
  });

  profileSingle.mockResolvedValue({
    data: { full_name: "", phone: "" },
    error: null,
  });
  getPublicUrl.mockReturnValue({ data: { publicUrl: "https://stub/photo.jpg" } });
});

const baseListing = {
  id: LISTING_ID,
  owner_id: OWNER_ID,
  title: "Belle maison à Nantes",
  type: "maison" as const,
  city: "Nantes",
  surface: 120,
  rooms: 5,
  price: 450000,
  description: "Une maison spacieuse avec jardin.",
  photos: [] as string[],
  status: "active" as const,
  created_at: "2025-03-15T12:00:00Z",
  updated_at: "2025-03-15T12:00:00Z",
};

describe("ListingDetailPage", () => {
  it("renders the listing title for a valid id", async () => {
    listingSingle.mockResolvedValue({ data: baseListing, error: null });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(
      screen.getByRole("heading", { name: "Belle maison à Nantes" }),
    ).toBeInTheDocument();
  });

  it("calls notFound() when the listing does not exist", async () => {
    listingSingle.mockResolvedValue({ data: null, error: null });
    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ id: LISTING_ID }) }),
    ).rejects.toThrow("__NOT_FOUND__");

    expect(notFound).toHaveBeenCalled();
  });

  it("calls notFound() without querying Supabase when the id is not a valid UUID", async () => {
    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ id: "not-a-uuid" }) }),
    ).rejects.toThrow("__NOT_FOUND__");

    expect(notFound).toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("renders the type label, city, surface, rooms count, and FR-formatted price", async () => {
    listingSingle.mockResolvedValue({ data: baseListing, error: null });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(screen.getByText("Maison")).toBeInTheDocument();
    expect(screen.getByText("Nantes")).toBeInTheDocument();
    expect(screen.getByText(/120\s*m²/)).toBeInTheDocument();
    expect(screen.getByText(/5\s*pièces/)).toBeInTheDocument();
    expect(screen.getByText(/450[\s ]000\s*€/)).toBeInTheDocument();
  });

  it("renders 'Appartement' label for an apartment listing", async () => {
    listingSingle.mockResolvedValue({
      data: { ...baseListing, type: "appartement" },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(screen.getByText("Appartement")).toBeInTheDocument();
  });

  it("renders the description when present", async () => {
    listingSingle.mockResolvedValue({
      data: { ...baseListing, description: "Une maison spacieuse avec jardin." },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(
      screen.getByText("Une maison spacieuse avec jardin."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /description/i })).toBeInTheDocument();
  });

  it("does not render the description section when description is null", async () => {
    listingSingle.mockResolvedValue({
      data: { ...baseListing, description: null },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(
      screen.queryByRole("heading", { name: /description/i }),
    ).not.toBeInTheDocument();
  });

  it("queries the owner's profile by owner_id and renders the seller's name and phone", async () => {
    listingSingle.mockResolvedValue({ data: baseListing, error: null });
    profileSingle.mockResolvedValue({
      data: { full_name: "Alice Martin", phone: "0612345678" },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(from).toHaveBeenCalledWith("profiles");
    expect(profileEq).toHaveBeenCalledWith("id", OWNER_ID);
    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("0612345678")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /vendeur/i }),
    ).toBeInTheDocument();
  });

  it("renders 'Non renseigné' when the seller's phone is null", async () => {
    listingSingle.mockResolvedValue({ data: baseListing, error: null });
    profileSingle.mockResolvedValue({
      data: { full_name: "Alice Martin", phone: null },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(screen.getByText(/non renseigné/i)).toBeInTheDocument();
  });

  it("renders 'Non renseigné' when the seller's phone is an empty string", async () => {
    listingSingle.mockResolvedValue({ data: baseListing, error: null });
    profileSingle.mockResolvedValue({
      data: { full_name: "Alice Martin", phone: "" },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(screen.getByText(/non renseigné/i)).toBeInTheDocument();
  });

  it("renders one image per photo using public URLs resolved from the storage bucket", async () => {
    listingSingle.mockResolvedValue({
      data: { ...baseListing, photos: ["owner/abc.jpg", "owner/def.png"] },
      error: null,
    });
    getPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: "https://cdn/abc.jpg" } })
      .mockReturnValueOnce({ data: { publicUrl: "https://cdn/def.png" } });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(storageFrom).toHaveBeenCalledWith("listings");
    expect(getPublicUrl).toHaveBeenNthCalledWith(1, "owner/abc.jpg");
    expect(getPublicUrl).toHaveBeenNthCalledWith(2, "owner/def.png");
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://cdn/abc.jpg");
    expect(images[1]).toHaveAttribute("src", "https://cdn/def.png");
  });

  it("does not render any image and does not call storage when the listing has no photos", async () => {
    listingSingle.mockResolvedValue({
      data: { ...baseListing, photos: [] },
      error: null,
    });
    const { default: Page } = await import("./page");

    render(await Page({ params: Promise.resolve({ id: LISTING_ID }) }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(storageFrom).not.toHaveBeenCalled();
  });
});
