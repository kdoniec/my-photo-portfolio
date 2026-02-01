import { test, expect } from "./fixtures/test-fixtures";

// Test credentials from .env.test
function getTestCredentials() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables");
  }

  return { email, password };
}

const TEST_USER = getTestCredentials();

/**
 * Generate unique category name with timestamp
 */
function generateCategoryName(): string {
  const timestamp = Date.now();
  return `Test Category ${timestamp}`;
}

test.describe("Categories Management", () => {
  test("should create a new category with generated name", async ({ loginPage, categoriesPage, page }) => {
    // Arrange - login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait for redirect after successful login
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Navigate to categories via nav link (more reliable than page.goto)
    await page.getByRole("link", { name: "Kategorie" }).click();
    await page.waitForURL(/\/admin\/categories/);

    // Wait for categories manager to load
    await categoriesPage.waitForManager();

    const initialCount = await categoriesPage.getCategoryCount();

    // Act - create category
    const categoryName = generateCategoryName();

    await categoriesPage.clickAddCategory();
    await expect(categoriesPage.categoryDialog.dialog).toBeVisible();

    await categoriesPage.categoryDialog.fill({
      name: categoryName,
      description: "Automatycznie wygenerowana kategoria testowa",
    });

    // Verify slug is generated
    const slugPreview = await categoriesPage.categoryDialog.getSlugPreview();
    expect(slugPreview).toContain("test-category");

    await categoriesPage.categoryDialog.submit();
    await categoriesPage.categoryDialog.waitForClose();

    // Assert - verify category exists
    await expect(categoriesPage.grid).toBeVisible();

    const newCount = await categoriesPage.getCategoryCount();
    expect(newCount).toBe(initialCount + 1);
  });
});
