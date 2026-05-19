import { describe, expect, it } from "vitest";
import { deleteListingSchema } from "./schema";

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
