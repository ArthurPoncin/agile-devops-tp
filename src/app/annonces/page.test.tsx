import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const eq = vi.fn();
const ilike = vi.fn();
const gte = vi.fn();
const lte = vi.fn();
const order = vi.fn();
const range = vi.fn();
const select = vi.fn();
const from = vi.fn();

const builder = { eq, ilike, gte, lte, order, range };
eq.mockReturnValue(builder);
ilike.mockReturnValue(builder);
gte.mockReturnValue(builder);
lte.mockReturnValue(builder);
order.mockReturnValue(builder);
select.mockReturnValue(builder);
from.mockReturnValue({ select });

const getUser = vi.fn(async () => ({ data: { user: null } }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from, auth: { getUser } })),
}));

beforeEach(() => {
  eq.mockClear();
  ilike.mockClear();
  gte.mockClear();
  lte.mockClear();
  order.mockClear();
  select.mockClear();
  from.mockClear();
  range.mockReset();
  range.mockResolvedValue({ data: [], count: 0, error: null });
});

describe("AnnoncesPage filters", () => {
  it("applies an ilike on city when the city searchParam is set", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ city: "Nantes" }) }));

    expect(ilike).toHaveBeenCalledWith("city", "%Nantes%");
  });

  it("does not apply an ilike on city when the city searchParam is empty or whitespace", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ city: "   " }) }));

    expect(ilike).not.toHaveBeenCalled();
  });

  it("trims whitespace around city before applying the ilike", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ city: "  Rennes  " }) }));

    expect(ilike).toHaveBeenCalledWith("city", "%Rennes%");
  });

  it("applies an eq on type when the type searchParam is 'maison'", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ type: "maison" }) }));

    expect(eq).toHaveBeenCalledWith("type", "maison");
  });

  it("applies an eq on type when the type searchParam is 'appartement'", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ type: "appartement" }) }));

    expect(eq).toHaveBeenCalledWith("type", "appartement");
  });

  it("ignores invalid values for the type searchParam", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ type: "chateau" }) }));

    expect(eq).not.toHaveBeenCalledWith("type", expect.anything());
  });

  it("applies a gte on price when priceMin is set to a positive integer", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({ searchParams: Promise.resolve({ priceMin: "150000" }) }),
    );

    expect(gte).toHaveBeenCalledWith("price", 150000);
  });

  it("applies an lte on price when priceMax is set to a positive integer", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({ searchParams: Promise.resolve({ priceMax: "500000" }) }),
    );

    expect(lte).toHaveBeenCalledWith("price", 500000);
  });

  it("ignores non-numeric values for priceMin / priceMax", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({ priceMin: "abc", priceMax: "xyz" }),
      }),
    );

    expect(gte).not.toHaveBeenCalledWith("price", expect.anything());
    expect(lte).not.toHaveBeenCalledWith("price", expect.anything());
  });

  it("ignores partially-numeric values like '3abc' for numeric filters", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({
          priceMin: "150000abc",
          rooms: "3xyz",
        }),
      }),
    );

    expect(gte).not.toHaveBeenCalledWith("price", expect.anything());
    expect(gte).not.toHaveBeenCalledWith("rooms", expect.anything());
  });

  it("applies gte/lte on surface when surfaceMin / surfaceMax are set", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({ surfaceMin: "40", surfaceMax: "120" }),
      }),
    );

    expect(gte).toHaveBeenCalledWith("surface", 40);
    expect(lte).toHaveBeenCalledWith("surface", 120);
  });

  it("ignores non-numeric values for surfaceMin / surfaceMax", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({ surfaceMin: "abc", surfaceMax: "xyz" }),
      }),
    );

    expect(gte).not.toHaveBeenCalledWith("surface", expect.anything());
    expect(lte).not.toHaveBeenCalledWith("surface", expect.anything());
  });

  it("applies a gte on rooms when rooms is set to a positive integer", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ rooms: "3" }) }));

    expect(gte).toHaveBeenCalledWith("rooms", 3);
  });

  it("ignores non-numeric or non-positive values for rooms", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ rooms: "abc" }) }));

    expect(gte).not.toHaveBeenCalledWith("rooms", expect.anything());
  });

  it("renders a GET form with one input for each filter and a submit button", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({}) }));

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByLabelText(/ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prix min/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prix max/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surface min/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surface max/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pièces/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechercher/i })).toBeInTheDocument();
  });

  it("composes all filters together when multiple searchParams are set", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({
          city: "Nantes",
          type: "maison",
          priceMin: "150000",
          priceMax: "500000",
          surfaceMin: "40",
          surfaceMax: "120",
          rooms: "3",
        }),
      }),
    );

    expect(ilike).toHaveBeenCalledWith("city", "%Nantes%");
    expect(eq).toHaveBeenCalledWith("type", "maison");
    expect(gte).toHaveBeenCalledWith("price", 150000);
    expect(lte).toHaveBeenCalledWith("price", 500000);
    expect(gte).toHaveBeenCalledWith("surface", 40);
    expect(lte).toHaveBeenCalledWith("surface", 120);
    expect(gte).toHaveBeenCalledWith("rooms", 3);
  });

  it("preserves filter searchParams in pagination links", async () => {
    range.mockResolvedValue({
      data: Array.from({ length: 9 }, (_, i) => ({
        id: `id-${i}`,
        title: `Listing ${i}`,
        city: "Nantes",
        price: 200000,
        surface: 80,
        photos: [],
      })),
      count: 30,
      error: null,
    });
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({
          city: "Nantes",
          type: "maison",
          rooms: "3",
        }),
      }),
    );

    const nextLink = screen.getByRole("link", { name: /next page/i });
    const href = nextLink.getAttribute("href") ?? "";
    expect(href).toContain("page=2");
    expect(href).toContain("city=Nantes");
    expect(href).toContain("type=maison");
    expect(href).toContain("rooms=3");
  });

  it("preserves the current filter values in the form inputs", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({
          city: "Nantes",
          type: "maison",
          priceMin: "150000",
          priceMax: "500000",
          surfaceMin: "40",
          surfaceMax: "120",
          rooms: "3",
        }),
      }),
    );

    expect(screen.getByLabelText(/ville/i)).toHaveValue("Nantes");
    expect(screen.getByLabelText(/type/i)).toHaveValue("maison");
    expect(screen.getByLabelText(/prix min/i)).toHaveValue(150000);
    expect(screen.getByLabelText(/prix max/i)).toHaveValue(500000);
    expect(screen.getByLabelText(/surface min/i)).toHaveValue(40);
    expect(screen.getByLabelText(/surface max/i)).toHaveValue(120);
    expect(screen.getByLabelText(/pièces/i)).toHaveValue(3);
  });

  it("does not echo invalid raw values back into the form inputs", async () => {
    const { default: Page } = await import("./page");

    render(
      await Page({
        searchParams: Promise.resolve({
          type: "chateau",
          priceMin: "150000abc",
          rooms: "0",
        }),
      }),
    );

    expect(screen.getByLabelText(/type/i)).toHaveValue("");
    expect(screen.getByLabelText(/prix min/i)).toHaveValue(null);
    expect(screen.getByLabelText(/pièces/i)).toHaveValue(null);
  });

  it("renders a reset link pointing to /annonces with no filters", async () => {
    const { default: Page } = await import("./page");

    render(await Page({ searchParams: Promise.resolve({ city: "Nantes" }) }));

    const resetLink = screen.getByRole("link", { name: /réinitialiser/i });
    expect(resetLink).toHaveAttribute("href", "/annonces");
  });
});
