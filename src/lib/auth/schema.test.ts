import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./schema";

describe("loginSchema", () => {
  it("accepts a valid email and a non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "alice@example.com",
      password: "s3cret!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing or malformed email", () => {
    expect(loginSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "alice@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid name, email, strong password and matching confirmation", () => {
    const result = signupSchema.safeParse({
      name: "Alice Martin",
      email: "alice@example.com",
      password: "secret12",
      confirmPassword: "secret12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = signupSchema.safeParse({
      name: "Alice Martin",
      email: "not-an-email",
      password: "secret12",
      confirmPassword: "secret12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weak password (too short, only letters, or only digits)", () => {
    const base = { name: "Alice", email: "alice@example.com" };
    // too short
    expect(
      signupSchema.safeParse({ ...base, password: "abc12", confirmPassword: "abc12" }).success,
    ).toBe(false);
    // only letters (no digit)
    expect(
      signupSchema.safeParse({ ...base, password: "abcdefgh", confirmPassword: "abcdefgh" })
        .success,
    ).toBe(false);
    // only digits (no letter)
    expect(
      signupSchema.safeParse({ ...base, password: "12345678", confirmPassword: "12345678" })
        .success,
    ).toBe(false);
  });

  it("rejects when the confirmation does not match the password", () => {
    const result = signupSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "secret12",
      confirmPassword: "different12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = signupSchema.safeParse({
      name: "",
      email: "alice@example.com",
      password: "secret12",
      confirmPassword: "secret12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    const result = signupSchema.safeParse({
      name: "   ",
      email: "alice@example.com",
      password: "secret12",
      confirmPassword: "secret12",
    });
    expect(result.success).toBe(false);
  });
});
