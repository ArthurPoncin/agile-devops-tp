import { describe, expect, it } from "vitest";
import { loginSchema } from "./schema";

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
