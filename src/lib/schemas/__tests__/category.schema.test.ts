import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategorySchema,
  categoryIdSchema,
  categoryListQuerySchema,
} from "../category.schema";

describe("categoryIdSchema", () => {
  it("should accept valid UUID", () => {
    const result = categoryIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID", () => {
    const result = categoryIdSchema.safeParse("invalid-uuid");
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = categoryIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("should accept valid category data", () => {
    const result = createCategorySchema.safeParse({
      name: "Weddings",
      description: "Wedding photography",
    });
    expect(result.success).toBe(true);
  });

  it("should accept name only (description optional)", () => {
    const result = createCategorySchema.safeParse({
      name: "Portraits",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createCategorySchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Name is required");
    }
  });

  it("should reject name longer than 100 characters", () => {
    const result = createCategorySchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Name must be at most 100 characters");
    }
  });

  it("should reject description longer than 500 characters", () => {
    const result = createCategorySchema.safeParse({
      name: "Valid Name",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Description must be at most 500 characters");
    }
  });

  it("should accept null description", () => {
    const result = createCategorySchema.safeParse({
      name: "Category",
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateCategorySchema", () => {
  it("should accept valid update data", () => {
    const result = updateCategorySchema.safeParse({
      name: "Updated Name",
      description: "Updated description",
      cover_photo_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = updateCategorySchema.safeParse({
      description: "Description only",
    });
    expect(result.success).toBe(false);
  });

  it("should accept null cover_photo_id", () => {
    const result = updateCategorySchema.safeParse({
      name: "Category",
      cover_photo_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cover_photo_id UUID", () => {
    const result = updateCategorySchema.safeParse({
      name: "Category",
      cover_photo_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid photo ID");
    }
  });
});

describe("reorderCategorySchema", () => {
  it("should accept valid order array", () => {
    const result = reorderCategorySchema.safeParse({
      order: [
        { id: "550e8400-e29b-41d4-a716-446655440000", display_order: 0 },
        { id: "550e8400-e29b-41d4-a716-446655440001", display_order: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty order array", () => {
    const result = reorderCategorySchema.safeParse({
      order: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Order array cannot be empty");
    }
  });

  it("should reject invalid category ID in order", () => {
    const result = reorderCategorySchema.safeParse({
      order: [{ id: "invalid", display_order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative display_order", () => {
    const result = reorderCategorySchema.safeParse({
      order: [{ id: "550e8400-e29b-41d4-a716-446655440000", display_order: -1 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display order must be non-negative");
    }
  });

  it("should accept zero display_order", () => {
    const result = reorderCategorySchema.safeParse({
      order: [{ id: "550e8400-e29b-41d4-a716-446655440000", display_order: 0 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("categoryListQuerySchema", () => {
  it("should accept empty query", () => {
    const result = categoryListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept valid sort options", () => {
    const sorts = ["display_order", "name", "created_at"];
    for (const sort of sorts) {
      const result = categoryListQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid sort option", () => {
    const result = categoryListQuerySchema.safeParse({ sort: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid order options", () => {
    const orders = ["asc", "desc"];
    for (const order of orders) {
      const result = categoryListQuerySchema.safeParse({ order });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid order option", () => {
    const result = categoryListQuerySchema.safeParse({ order: "random" });
    expect(result.success).toBe(false);
  });
});
