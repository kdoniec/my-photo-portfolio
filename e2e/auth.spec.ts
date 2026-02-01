import { test, expect } from "./fixtures/test-fixtures";

test.describe("Authentication", () => {
  test("should display login form", async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login("invalid@example.com", "wrongpassword");
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
