import { describe, it, expect } from "vitest";
import { loginSchema, type LoginFormData } from "../login.schema";

describe("loginSchema", () => {
  describe("valid data", () => {
    it("should accept valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: "user@example.com",
          password: "password123",
        });
      }
    });

    it("should accept email with subdomain", () => {
      const result = loginSchema.safeParse({
        email: "user@mail.example.com",
        password: "test",
      });
      expect(result.success).toBe(true);
    });

    it("should accept short password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "a",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Email jest wymagany");
      }
    });

    it("should reject missing email field", () => {
      const result = loginSchema.safeParse({
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format - missing @", () => {
      const result = loginSchema.safeParse({
        email: "userexample.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Nieprawidłowy format email");
      }
    });

    it("should reject invalid email format - missing domain", () => {
      const result = loginSchema.safeParse({
        email: "user@",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Nieprawidłowy format email");
      }
    });
  });

  describe("password validation", () => {
    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło jest wymagane");
      }
    });

    it("should reject missing password field", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct LoginFormData type", () => {
      const validData: LoginFormData = {
        email: "user@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
