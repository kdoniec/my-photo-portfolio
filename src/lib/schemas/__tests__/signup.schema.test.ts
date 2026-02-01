import { describe, it, expect } from "vitest";
import { signupSchema, type SignupFormData } from "../signup.schema";

describe("signupSchema", () => {
  const validData = {
    email: "user@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  describe("valid data", () => {
    it("should accept valid signup data", () => {
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept password exactly 8 characters", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Passwo1d",
        confirmPassword: "Passwo1d",
      });
      expect(result.success).toBe(true);
    });

    it("should accept password with special characters", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Pass1@#$%",
        confirmPassword: "Pass1@#$%",
      });
      expect(result.success).toBe(true);
    });

    it("should accept long password", () => {
      const longPassword = "Aa1" + "x".repeat(50);
      const result = signupSchema.safeParse({
        ...validData,
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const result = signupSchema.safeParse({
        ...validData,
        email: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Email jest wymagany");
      }
    });

    it("should reject invalid email format", () => {
      const result = signupSchema.safeParse({
        ...validData,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toBe("Nieprawidłowy format email");
      }
    });
  });

  describe("password strength validation", () => {
    it("should reject password shorter than 8 characters", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Pass1",
        confirmPassword: "Pass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi mieć minimum 8 znaków");
      }
    });

    it("should reject password without uppercase letter", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "password1",
        confirmPassword: "password1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej jedną wielką literę");
      }
    });

    it("should reject password without lowercase letter", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "PASSWORD1",
        confirmPassword: "PASSWORD1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej jedną małą literę");
      }
    });

    it("should reject password without digit", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Password",
        confirmPassword: "Password",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej jedną cyfrę");
      }
    });

    it("should reject empty password", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e) => e.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło jest wymagane");
      }
    });
  });

  describe("password confirmation", () => {
    it("should reject mismatched passwords", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Password1",
        confirmPassword: "Password2",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find((e) => e.path[0] === "confirmPassword");
        expect(confirmError?.message).toBe("Hasła muszą być identyczne");
      }
    });

    it("should reject empty confirmPassword", () => {
      const result = signupSchema.safeParse({
        ...validData,
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find((e) => e.path[0] === "confirmPassword");
        expect(confirmError?.message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should place mismatch error on confirmPassword path", () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: "Password1",
        confirmPassword: "DifferentPass1",
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
    it("should infer correct SignupFormData type", () => {
      const data: SignupFormData = {
        email: "user@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
