import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

import { ListingFilters } from "./listing-filters";

beforeEach(() => {
  replace.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function flushDebounce() {
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe("<ListingFilters> auto-search", () => {
  it("debounces input and calls router.replace once with the encoded query", () => {
    render(<ListingFilters values={{}} />);

    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "Nantes" } });
    expect(replace).not.toHaveBeenCalled();

    flushDebounce();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/annonces?city=Nantes", { scroll: false });
  });

  it("does not call router.replace when the trimmed value is empty", () => {
    render(<ListingFilters values={{}} />);

    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "   " } });
    flushDebounce();

    expect(replace).not.toHaveBeenCalled();
  });

  it("calls router.replace with /annonces (no query) when all filters become empty", () => {
    render(<ListingFilters values={{ city: "Nantes" }} />);

    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "" } });
    flushDebounce();

    expect(replace).toHaveBeenCalledWith("/annonces", { scroll: false });
  });

  it("encodes multiple filters into the query string", () => {
    render(<ListingFilters values={{}} />);

    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "Nantes" } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: "maison" } });
    flushDebounce();

    const lastCall = replace.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toMatch(/^\/annonces\?/);
    expect(lastCall).toContain("city=Nantes");
    expect(lastCall).toContain("type=maison");
  });

  it("only fires once when several inputs change within the debounce window", () => {
    render(<ListingFilters values={{}} />);

    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "N" } });
    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "Na" } });
    fireEvent.change(screen.getByLabelText(/ville/i), { target: { value: "Nan" } });
    flushDebounce();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/annonces?city=Nan", { scroll: false });
  });

  it("keeps focus on the input across the auto-triggered server re-render", () => {
    const { rerender } = render(<ListingFilters values={{}} />);
    const input = screen.getByLabelText(/ville/i) as HTMLInputElement;

    input.focus();
    fireEvent.change(input, { target: { value: "Nan" } });
    flushDebounce();

    // Simulate the parent server component re-rendering with the new URL-derived values.
    rerender(<ListingFilters values={{ city: "Nan" }} />);

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("Nan");
  });

  it("re-syncs from `values` when they change from outside (e.g. Réinitialiser)", () => {
    const { rerender } = render(<ListingFilters values={{ city: "Nantes" }} />);

    expect((screen.getByLabelText(/ville/i) as HTMLInputElement).value).toBe("Nantes");

    rerender(<ListingFilters values={{}} />);

    expect((screen.getByLabelText(/ville/i) as HTMLInputElement).value).toBe("");
  });
});
