import { describe, expect, it } from "vitest";
import { profileUpdateSchema } from "./schema";

const validInput = {
  full_name: "Alice Martin",
  email: "alice@example.com",
  phone: "06 12 34 56 78",
};

describe("profileUpdateSchema", () => {
  it("accepts a valid profile input", () => {
    const result = profileUpdateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts an empty phone (phone is optional)", () => {
    const result = profileUpdateSchema.safeParse({ ...validInput, phone: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a missing phone field", () => {
    const result = profileUpdateSchema.safeParse({
      full_name: validInput.full_name,
      email: validInput.email,
    });
    expect(result.success).toBe(true);
  });

  it("trims the full_name", () => {
    const result = profileUpdateSchema.safeParse({
      ...validInput,
      full_name: "  Alice Martin  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe("Alice Martin");
    }
  });

  it("rejects an empty full_name", () => {
    const result = profileUpdateSchema.safeParse({ ...validInput, full_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a full_name composed only of spaces", () => {
    const result = profileUpdateSchema.safeParse({ ...validInput, full_name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an empty email", () => {
    const result = profileUpdateSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = profileUpdateSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a phone with letters", () => {
    const result = profileUpdateSchema.safeParse({
      ...validInput,
      phone: "06ABCD5678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a phone longer than 20 characters", () => {
    const result = profileUpdateSchema.safeParse({
      ...validInput,
      phone: "+33 6 12 34 56 78 90 12 34",
    });
    expect(result.success).toBe(false);
  });
});
