import { describe, it, expect } from "vitest";
import { jsonResponse, errorResponse } from "../api-utils";

describe("api-utils", () => {
  describe("jsonResponse", () => {
    it("should create a Response with JSON body", async () => {
      const data = { message: "Hello" };
      const response = jsonResponse(data);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it("should set Content-Type header to application/json", () => {
      const response = jsonResponse({ test: true });

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should use status 200 by default", () => {
      const response = jsonResponse({ test: true });

      expect(response.status).toBe(200);
    });

    it("should accept custom status code", () => {
      const response = jsonResponse({ created: true }, 201);

      expect(response.status).toBe(201);
    });

    it("should handle array data", async () => {
      const data = [1, 2, 3];
      const response = jsonResponse(data);

      const body = await response.json();
      expect(body).toEqual([1, 2, 3]);
    });

    it("should handle null data", async () => {
      const response = jsonResponse(null);

      const body = await response.json();
      expect(body).toBeNull();
    });

    it("should handle complex nested data", async () => {
      const data = {
        user: { id: 1, name: "John" },
        items: [{ id: 1 }, { id: 2 }],
      };
      const response = jsonResponse(data);

      const body = await response.json();
      expect(body).toEqual(data);
    });
  });

  describe("errorResponse", () => {
    it("should create ErrorResponseDTO structure", async () => {
      const response = errorResponse("NOT_FOUND", "Resource not found", 404);

      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should include code and message in error", async () => {
      const response = errorResponse("VALIDATION_ERROR", "Invalid input", 400);

      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Invalid input");
    });

    it("should set correct status code", () => {
      const response = errorResponse("UNAUTHORIZED", "Not authorized", 401);

      expect(response.status).toBe(401);
    });

    it("should include details when provided", async () => {
      const details = { field: "email", reason: "invalid format" };
      const response = errorResponse("VALIDATION_ERROR", "Invalid input", 400, details);

      const body = await response.json();
      expect(body.error.details).toEqual(details);
    });

    it("should omit details when not provided", async () => {
      const response = errorResponse("SERVER_ERROR", "Internal error", 500);

      const body = await response.json();
      expect(body.error).not.toHaveProperty("details");
    });

    it("should set Content-Type header to application/json", () => {
      const response = errorResponse("ERROR", "Error message", 400);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle complex details object", async () => {
      const details = {
        fields: [
          { name: "email", error: "required" },
          { name: "password", error: "too short" },
        ],
        timestamp: "2024-01-15T12:00:00Z",
      };
      const response = errorResponse("VALIDATION_ERROR", "Multiple errors", 400, details);

      const body = await response.json();
      expect(body.error.details).toEqual(details);
    });
  });
});
