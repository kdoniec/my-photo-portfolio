import { describe, it, expect } from "vitest";
import {
  photoIdSchema,
  photoListQuerySchema,
  createPhotoMetadataSchema,
  photoFileDimensionsSchema,
  updatePhotoSchema,
  publishPhotoSchema,
  validatePhotoFile,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "../photo.schema";

describe("photoIdSchema", () => {
  it("should accept valid UUID", () => {
    const result = photoIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID", () => {
    const result = photoIdSchema.safeParse("invalid-uuid");
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = photoIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("photoListQuerySchema", () => {
  it("should accept empty query (use defaults)", () => {
    const result = photoListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      page: 1,
      limit: 20,
      sort: "created_at",
      order: "desc",
    });
  });

  it("should accept valid category_id UUID", () => {
    const result = photoListQuerySchema.safeParse({
      category_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should accept 'uncategorized' as category_id", () => {
    const result = photoListQuerySchema.safeParse({
      category_id: "uncategorized",
    });
    expect(result.success).toBe(true);
    expect(result.data?.category_id).toBe("uncategorized");
  });

  it("should transform is_published string to boolean", () => {
    const resultTrue = photoListQuerySchema.safeParse({ is_published: "true" });
    expect(resultTrue.success).toBe(true);
    expect(resultTrue.data?.is_published).toBe(true);

    const resultFalse = photoListQuerySchema.safeParse({ is_published: "false" });
    expect(resultFalse.success).toBe(true);
    expect(resultFalse.data?.is_published).toBe(false);
  });

  it("should reject invalid page number", () => {
    const result = photoListQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject limit greater than 50", () => {
    const result = photoListQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });

  it("should accept valid sort options", () => {
    const result1 = photoListQuerySchema.safeParse({ sort: "created_at" });
    expect(result1.success).toBe(true);

    const result2 = photoListQuerySchema.safeParse({ sort: "title" });
    expect(result2.success).toBe(true);
  });

  it("should reject invalid sort option", () => {
    const result = photoListQuerySchema.safeParse({ sort: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("createPhotoMetadataSchema", () => {
  it("should accept empty object (all optional)", () => {
    const result = createPhotoMetadataSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.is_published).toBe(false);
  });

  it("should accept valid metadata", () => {
    const result = createPhotoMetadataSchema.safeParse({
      title: "My Photo",
      category_id: "550e8400-e29b-41d4-a716-446655440000",
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject title longer than 200 characters", () => {
    const result = createPhotoMetadataSchema.safeParse({
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid category_id", () => {
    const result = createPhotoMetadataSchema.safeParse({
      category_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should coerce is_published to boolean", () => {
    const result = createPhotoMetadataSchema.safeParse({
      is_published: "true",
    });
    expect(result.success).toBe(true);
    expect(result.data?.is_published).toBe(true);
  });
});

describe("photoFileDimensionsSchema", () => {
  it("should accept valid dimensions", () => {
    const result = photoFileDimensionsSchema.safeParse({
      original_width: 1920,
      original_height: 1080,
      file_size_bytes: 1024000,
    });
    expect(result.success).toBe(true);
  });

  it("should coerce string numbers to integers", () => {
    const result = photoFileDimensionsSchema.safeParse({
      original_width: "1920",
      original_height: "1080",
      file_size_bytes: "1024000",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      original_width: 1920,
      original_height: 1080,
      file_size_bytes: 1024000,
    });
  });

  it("should reject non-positive width", () => {
    const result = photoFileDimensionsSchema.safeParse({
      original_width: 0,
      original_height: 1080,
      file_size_bytes: 1024000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative height", () => {
    const result = photoFileDimensionsSchema.safeParse({
      original_width: 1920,
      original_height: -100,
      file_size_bytes: 1024000,
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePhotoSchema", () => {
  it("should accept empty object", () => {
    const result = updatePhotoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept partial update", () => {
    const result = updatePhotoSchema.safeParse({
      title: "Updated Title",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null values", () => {
    const result = updatePhotoSchema.safeParse({
      title: null,
      category_id: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("publishPhotoSchema", () => {
  it("should accept is_published: true", () => {
    const result = publishPhotoSchema.safeParse({ is_published: true });
    expect(result.success).toBe(true);
  });

  it("should accept is_published: false", () => {
    const result = publishPhotoSchema.safeParse({ is_published: false });
    expect(result.success).toBe(true);
  });

  it("should reject missing is_published", () => {
    const result = publishPhotoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject non-boolean is_published", () => {
    const result = publishPhotoSchema.safeParse({ is_published: "true" });
    expect(result.success).toBe(false);
  });
});

describe("validatePhotoFile", () => {
  const createMockFile = (type: string, size: number): File => {
    const blob = new Blob(["x".repeat(size)], { type });
    return new File([blob], "test.jpg", { type });
  };

  it("should accept valid JPEG file", () => {
    const file = createMockFile("image/jpeg", 1024);
    const result = validatePhotoFile(file, "photo");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(file);
    }
  });

  it("should reject null file", () => {
    const result = validatePhotoFile(null, "photo");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("REQUIRED");
      expect(result.error.message).toBe("photo is required");
    }
  });

  it("should reject undefined file", () => {
    const result = validatePhotoFile(undefined, "photo");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("REQUIRED");
    }
  });

  it("should reject non-JPEG file", () => {
    const file = createMockFile("image/png", 1024);
    const result = validatePhotoFile(file, "photo");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_TYPE");
      expect(result.error.message).toBe("photo must be JPEG");
    }
  });

  it("should reject file exceeding size limit", () => {
    const file = createMockFile("image/jpeg", MAX_FILE_SIZE_BYTES + 1);
    const result = validatePhotoFile(file, "photo");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FILE_TOO_LARGE");
      expect(result.error.message).toBe("photo must be at most 10MB");
    }
  });

  it("should accept file at exactly the size limit", () => {
    const file = createMockFile("image/jpeg", MAX_FILE_SIZE_BYTES);
    const result = validatePhotoFile(file, "photo");
    expect(result.success).toBe(true);
  });

  it("should use correct field name in error messages", () => {
    const result = validatePhotoFile(null, "thumbnail");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("thumbnail is required");
    }
  });
});

describe("constants", () => {
  it("should have correct ALLOWED_MIME_TYPES", () => {
    expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES.length).toBe(1);
  });

  it("should have correct MAX_FILE_SIZE_BYTES (10MB)", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
