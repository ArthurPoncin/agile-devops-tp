import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingCard } from "./listing-card";

describe("<ListingCard>", () => {
  it("renders the title, an Active status badge, and the FR-formatted creation date", () => {
    render(
      <ListingCard
        listing={{
          id: "l1",
          title: "Maison à Nantes",
          status: "active",
          created_at: "2025-03-15T12:00:00Z",
        }}
      />,
    );

    expect(screen.getByText("Maison à Nantes")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(/15 mars 2025/i)).toBeInTheDocument();
  });

  it("renders an Archivée badge for an archived listing", () => {
    render(
      <ListingCard
        listing={{
          id: "l2",
          title: "Studio archivé",
          status: "archived",
          created_at: "2025-01-02T08:00:00Z",
        }}
      />,
    );

    expect(screen.getByText("Archivée")).toBeInTheDocument();
  });
});
