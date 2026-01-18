# REST API Plan

## 1. Resources

| Resource   | Database Table          | Description                                                 |
| ---------- | ----------------------- | ----------------------------------------------------------- |
| Profile    | `profiles`              | Photographer profile data (display name, bio, contact info) |
| Settings   | `photographer_settings` | SEO settings (site title, description)                      |
| Categories | `categories`            | Photo categories for portfolio organization                 |
| Photos     | `photos`                | Photo metadata with references to storage paths             |

## 2. Endpoints

### 2.1 Profile

#### GET /api/profile

Get current user's profile.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Success Response (200):**

```json
{
  "id": "uuid",
  "display_name": "string",
  "bio": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Profile not found

---

#### PUT /api/profile

Update current user's profile.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "display_name": "string (required, max 100 chars)",
  "bio": "string | null",
  "contact_email": "string | null (valid email if provided, max 255 chars)",
  "contact_phone": "string | null (max 20 chars)"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "display_name": "string",
  "bio": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated

---

### 2.2 Settings (SEO)

#### GET /api/settings

Get current user's SEO settings.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Success Response (200):**

```json
{
  "id": "uuid",
  "photographer_id": "uuid",
  "site_title": "string | null",
  "site_description": "string | null",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Settings not found

---

#### PUT /api/settings

Update current user's SEO settings.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "site_title": "string | null (max 100 chars)",
  "site_description": "string | null (max 300 chars)"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "photographer_id": "uuid",
  "site_title": "string | null",
  "site_description": "string | null",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated

---

### 2.3 Categories

#### GET /api/categories

List all categories for the authenticated photographer.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**

- `sort` - Sort field: `display_order` (default), `name`, `created_at`
- `order` - Sort order: `asc` (default), `desc`

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "cover_photo_id": "uuid | null",
      "cover_photo_url": "string | null",
      "display_order": "number",
      "photos_count": "number",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime"
    }
  ],
  "total": "number",
  "limit": 10
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated

---

#### GET /api/categories/:id

Get a single category by ID.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "cover_photo_id": "uuid | null",
  "cover_photo_url": "string | null",
  "display_order": "number",
  "photos_count": "number",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Category not found

---

#### POST /api/categories

Create a new category.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "description": "string | null"
}
```

**Note:** `slug` is auto-generated from `name`. `display_order` is auto-assigned by trigger.

**Success Response (201):**

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "cover_photo_id": null,
  "display_order": "number",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or duplicate slug
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Category limit reached (max 10)

---

#### PUT /api/categories/:id

Update an existing category.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "description": "string | null",
  "cover_photo_id": "uuid | null"
}
```

**Note:** `slug` is re-generated if `name` changes.

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "cover_photo_id": "uuid | null",
  "display_order": "number",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or duplicate slug
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Category not found

---

#### PUT /api/categories/reorder

Reorder categories by updating display_order.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "order": [{ "id": "uuid", "display_order": "number" }]
}
```

**Success Response (200):**

```json
{
  "message": "Categories reordered successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated

---

#### DELETE /api/categories/:id

Delete a category.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Note:** Photos in deleted category will have `category_id` set to `null` (become unassigned).

**Success Response (200):**

```json
{
  "message": "Category deleted successfully",
  "affected_photos_count": "number"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Category not found

---

### 2.4 Photos

#### GET /api/photos

List photos for the authenticated photographer.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**

- `category_id` - Filter by category (uuid | "uncategorized" | omit for all)
- `is_published` - Filter by publication status (true | false | omit for all)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)
- `sort` - Sort field: `created_at` (default), `title`
- `order` - Sort order: `desc` (default), `asc`

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string | null",
      "category_id": "uuid | null",
      "category_name": "string | null",
      "thumbnail_url": "string",
      "preview_url": "string",
      "original_width": "number",
      "original_height": "number",
      "file_size_bytes": "number",
      "mime_type": "string",
      "is_published": "boolean",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "total_pages": "number"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated

---

#### GET /api/photos/:id

Get a single photo by ID.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Success Response (200):**

```json
{
  "id": "uuid",
  "title": "string | null",
  "category_id": "uuid | null",
  "category_name": "string | null",
  "thumbnail_url": "string",
  "preview_url": "string",
  "original_width": "number",
  "original_height": "number",
  "file_size_bytes": "number",
  "mime_type": "string",
  "is_published": "boolean",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Photo not found

---

#### POST /api/photos

Upload a new photo. Uses multipart/form-data.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**

- `file` - Image file (required, JPEG only, max 10MB)
- `title` - Photo title (optional, max 200 chars)
- `category_id` - Category UUID (optional)
- `is_published` - Publication status (optional, default: false)

**Note:** Client-side processing generates thumbnail (400px) and preview (1200px). Server stores both versions.

**Success Response (201):**

```json
{
  "id": "uuid",
  "title": "string | null",
  "category_id": "uuid | null",
  "thumbnail_url": "string",
  "preview_url": "string",
  "original_width": "number",
  "original_height": "number",
  "file_size_bytes": "number",
  "mime_type": "image/jpeg",
  "is_published": "boolean",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file format, size exceeded, or validation error
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Photo limit reached (max 200)
- `413 Payload Too Large` - File exceeds 10MB

---

#### POST /api/photos/batch

Batch upload multiple photos.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**

- `files[]` - Multiple image files (required, JPEG only, max 10MB each)
- `category_id` - Category UUID (optional, applied to all)
- `is_published` - Publication status (optional, default: false, applied to all)

**Success Response (201):**

```json
{
  "uploaded": [
    {
      "id": "uuid",
      "thumbnail_url": "string",
      "preview_url": "string"
    }
  ],
  "failed": [
    {
      "filename": "string",
      "error": "string"
    }
  ],
  "summary": {
    "total": "number",
    "successful": "number",
    "failed": "number"
  }
}
```

**Error Responses:**

- `400 Bad Request` - No files provided
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Photo limit would be exceeded

---

#### PUT /api/photos/:id

Update photo metadata.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "title": "string | null (max 200 chars)",
  "category_id": "uuid | null",
  "is_published": "boolean"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "title": "string | null",
  "category_id": "uuid | null",
  "thumbnail_url": "string",
  "preview_url": "string",
  "original_width": "number",
  "original_height": "number",
  "file_size_bytes": "number",
  "mime_type": "string",
  "is_published": "boolean",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Photo not found

---

#### PATCH /api/photos/:id/publish

Toggle photo publication status.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Request Body:**

```json
{
  "is_published": "boolean"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "is_published": "boolean",
  "updated_at": "ISO 8601 datetime"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Photo not found

---

#### DELETE /api/photos/:id

Delete a photo and its storage files.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Note:** Deletes both thumbnail and preview from Supabase Storage. If photo is a category cover, trigger assigns new cover automatically.

**Success Response (200):**

```json
{
  "message": "Photo deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Photo not found

---

### 2.5 Public Endpoints

These endpoints do not require authentication and serve the public portfolio.

#### GET /api/public/profile

Get photographer's public profile.

**Success Response (200):**

```json
{
  "display_name": "string",
  "bio": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null"
}
```

---

#### GET /api/public/settings

Get SEO settings for meta tags.

**Success Response (200):**

```json
{
  "site_title": "string | null",
  "site_description": "string | null"
}
```

---

#### GET /api/public/categories

List categories with published photos (for public gallery).

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "cover_photo_url": "string | null",
      "display_order": "number",
      "photos_count": "number"
    }
  ]
}
```

**Note:** Only returns categories that have at least one published photo.

---

#### GET /api/public/categories/:slug

Get category details by slug.

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "cover_photo_url": "string | null"
}
```

**Error Responses:**

- `404 Not Found` - Category not found or has no published photos

---

#### GET /api/public/categories/:slug/photos

List published photos in a category.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string | null",
      "thumbnail_url": "string",
      "preview_url": "string",
      "original_width": "number",
      "original_height": "number"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "total_pages": "number"
  }
}
```

**Note:** Only returns published photos. Sorted by `created_at` descending.

**Error Responses:**

- `404 Not Found` - Category not found

---

### 2.6 Stats/Limits Endpoint

#### GET /api/stats

Get current usage statistics and limits.

**Request Headers:**

- `Authorization: Bearer <access_token>` (required)

**Success Response (200):**

```json
{
  "photos": {
    "count": "number",
    "limit": 200
  },
  "categories": {
    "count": "number",
    "limit": 10
  },
  "storage_used_bytes": "number | null"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated

---

## 3. Authentication and Authorization

> **Note:** Authentication endpoints (login, logout, refresh) will be implemented in a future iteration. This section describes the authorization model that will be used.

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with JWT tokens. Authentication is handled via Supabase SDK on the client side and validated in Astro middleware.

### 3.2 Authorization

Authorization is enforced at two levels:

1. **API Level:**
   - All `/api/*` endpoints (except `/api/public/*`) require valid session
   - Middleware checks `auth.uid()` matches resource ownership

2. **Database Level (RLS):**
   - Row Level Security policies ensure data isolation
   - `authenticated` role can only access own data
   - `anon` role can read public data only (published photos, categories with published photos)

### 3.3 Protected Routes

| Route Pattern       | Access                     |
| ------------------- | -------------------------- |
| `/api/public/*`     | Public                     |
| `/api/profile`      | Authenticated (owner only) |
| `/api/settings`     | Authenticated (owner only) |
| `/api/categories/*` | Authenticated (owner only) |
| `/api/photos/*`     | Authenticated (owner only) |
| `/api/stats`        | Authenticated (owner only) |

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Profile

| Field           | Type   | Constraints                          |
| --------------- | ------ | ------------------------------------ |
| `display_name`  | string | Required, max 100 chars              |
| `bio`           | string | Optional, text                       |
| `contact_email` | string | Optional, valid email, max 255 chars |
| `contact_phone` | string | Optional, max 20 chars               |

#### Settings

| Field              | Type   | Constraints             |
| ------------------ | ------ | ----------------------- |
| `site_title`       | string | Optional, max 100 chars |
| `site_description` | string | Optional, max 300 chars |

#### Category

| Field            | Type    | Constraints                             |
| ---------------- | ------- | --------------------------------------- |
| `name`           | string  | Required, max 100 chars                 |
| `slug`           | string  | Auto-generated, unique per photographer |
| `description`    | string  | Optional, text                          |
| `cover_photo_id` | uuid    | Optional, must reference own photo      |
| `display_order`  | integer | Auto-assigned                           |

#### Photo

| Field          | Type    | Constraints                           |
| -------------- | ------- | ------------------------------------- |
| `file`         | file    | Required, JPEG only, max 10MB         |
| `title`        | string  | Optional, max 200 chars               |
| `category_id`  | uuid    | Optional, must reference own category |
| `is_published` | boolean | Default: false                        |

### 4.2 Business Logic

#### Slug Generation

- Generated from category `name` using:
  - Lowercase conversion
  - Polish diacritics normalization (ą→a, ę→e, etc.)
  - Replace spaces/special chars with hyphens
  - Remove consecutive hyphens
- Must be unique per photographer

#### Limits Enforcement

- **Photos:** Maximum 200 per photographer
  - Validated before upload/batch upload
  - Returns `409 Conflict` when limit reached
- **Categories:** Maximum 10 per photographer
  - Validated before creation
  - Returns `409 Conflict` when limit reached

#### Image Processing (Client-side)

- Use `browser-image-compression` library
- Generate two versions before upload:
  - Thumbnail: 400px width, maintain aspect ratio
  - Preview: 1200px width, maintain aspect ratio
- Original file not stored (saves storage space)

#### Category Cover Photo

- When cover photo is deleted, trigger selects next published photo as cover
- Cover must be from the same category
- Cover is displayed on public category listing

#### Photo Publication

- Unpublished photos are hidden from public endpoints
- Photos without category are hidden from public (even if published)
- Toggle via `PATCH /api/photos/:id/publish` or `PUT /api/photos/:id`

#### Cascading Deletes

- **Profile deletion:** Cascades to settings, categories, photos
- **Category deletion:** Photos get `category_id = null` (soft unassign)
- **Photo deletion:**
  - Removes storage files (thumbnail + preview)
  - Updates category cover if was cover photo

#### Display Order

- Categories have `display_order` for custom sorting
- Auto-assigned on creation (max + 1)
- Reorderable via `PUT /api/categories/reorder`

### 4.3 Error Codes Summary

| Code                        | Meaning                                      |
| --------------------------- | -------------------------------------------- |
| `200 OK`                    | Successful GET/PUT/PATCH/DELETE              |
| `201 Created`               | Successful POST (resource created)           |
| `400 Bad Request`           | Validation error, invalid input              |
| `401 Unauthorized`          | Missing or invalid authentication            |
| `403 Forbidden`             | Authenticated but not authorized             |
| `404 Not Found`             | Resource doesn't exist                       |
| `409 Conflict`              | Business rule violation (limits, duplicates) |
| `413 Payload Too Large`     | File exceeds size limit                      |
| `500 Internal Server Error` | Unexpected server error                      |

### 4.4 Response Format Consistency

All API responses follow this structure:

**Success (single resource):**

```json
{
  "id": "...",
  "field": "value"
}
```

**Success (collection):**

```json
{
  "data": [...],
  "pagination": { ... }
}
```

**Error:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```
