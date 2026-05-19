import { describe, expect, it } from "vitest";
import { deleteListingSchema, listingCreateSchema } from "./schema";

const validInput = {
  title: "Bel appartement lumineux",
  type: "appartement",
  city: "Nantes",
  surface: 65,
  rooms: 3,
  price: 250000,
};

describe("listingCreateSchema", () => {
  it("accepts a valid listing input", () => {
    const result = listingCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = listingCreateSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a type that is not 'maison' or 'appartement'", () => {
    const result = listingCreateSchema.safeParse({ ...validInput, type: "studio" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty city", () => {
    const result = listingCreateSchema.safeParse({ ...validInput, city: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive surface", () => {
    expect(listingCreateSchema.safeParse({ ...validInput, surface: 0 }).success).toBe(false);
    expect(listingCreateSchema.safeParse({ ...validInput, surface: -10 }).success).toBe(false);
  });

  it("rejects a non-positive number of rooms", () => {
    expect(listingCreateSchema.safeParse({ ...validInput, rooms: 0 }).success).toBe(false);
    expect(listingCreateSchema.safeParse({ ...validInput, rooms: -1 }).success).toBe(false);
  });

  it("rejects a non-positive price", () => {
    expect(listingCreateSchema.safeParse({ ...validInput, price: 0 }).success).toBe(false);
    expect(listingCreateSchema.safeParse({ ...validInput, price: -1000 }).success).toBe(false);
  });

  it("coerces numeric string inputs (FormData values) to numbers", () => {
    const result = listingCreateSchema.safeParse({
      ...validInput,
      surface: "65",
      rooms: "3",
      price: "250000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.surface).toBe(65);
      expect(result.data.rooms).toBe(3);
      expect(result.data.price).toBe(250000);
    }
  });
});

describe("deleteListingSchema", () => {
  it("accepts a valid UUID listing id", () => {
    const result = deleteListingSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty or missing id", () => {
    expect(deleteListingSchema.safeParse({ id: "" }).success).toBe(false);
    expect(deleteListingSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a non-UUID string", () => {
    const result = deleteListingSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
