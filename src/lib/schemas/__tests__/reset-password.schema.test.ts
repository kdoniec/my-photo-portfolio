import { describe, it, expect } from "vitest";
import {
  resetPasswordSchema,
  setPasswordSchema,
  type ResetPasswordFormData,
  type SetPasswordFormData,
} from "../reset-password.schema";

describe("resetPasswordSchema", () => {
  describe("valid data", () => {
    it("should accept valid email", () => {
      const result = resetPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should accept email with subdomain", () => {
      const result = resetPasswordSchema.safeParse({
        email: "user@mail.example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const result = resetPasswordSchema.safeParse({
        email: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Email jest wymagany");
      }
    });

    it("should reject invalid email format", () => {
      const result = resetPasswordSchema.safeParse({
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Nieprawidłowy format email");
      }
    });

    it("should reject missing email field", () => {
      const result = resetPasswordSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct ResetPasswordFormData type", () => {
      const data: ResetPasswordFormData = {
        email: "user@example.com",
      };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe("setPasswordSchema", () => {
  const validData = {
    password: "newpassword",
    confirmPassword: "newpassword",
  };

  describe("valid data", () => {
    it("should accept valid matching passwords", () => {
      const result = setPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept password exactly 8 characters", () => {
      const result = setPasswordSchema.safeParse({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(result.success).toBe(true);
    });

    it("should accept long password", () => {
      const longPassword = "a".repeat(100);
      const result = setPasswordSchema.safeParse({
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 8 characters", () => {
      const result = setPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi mieć minimum 8 znaków");
      }
    });

    it("should reject empty password", () => {
      const result = setPasswordSchema.safeParse({
        password: "",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password confirmation", () => {
    it("should reject mismatched passwords", () => {
      const result = setPasswordSchema.safeParse({
        password: "newpassword1",
        confirmPassword: "newpassword2",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find((e) => e.path[0] === "confirmPassword");
        expect(confirmError?.message).toBe("Hasła muszą być identyczne");
      }
    });

    it("should reject empty confirmPassword", () => {
      const result = setPasswordSchema.safeParse({
        password: "newpassword",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find((e) => e.path[0] === "confirmPassword");
        expect(confirmError?.message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should place mismatch error on confirmPassword path", () => {
      const result = setPasswordSchema.safeParse({
        password: "password123",
        confirmPassword: "differentpassword",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find(
          (e) => e.path[0] === "confirmPassword" && e.message === "Hasła muszą być identyczne"
        );
        expect(confirmError).toBeDefined();
      }
    });
  });

  describe("type inference", () => {
    it("should infer correct SetPasswordFormData type", () => {
      const data: SetPasswordFormData = {
        password: "newpassword",
        confirmPassword: "newpassword",
      };
      const result = setPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
