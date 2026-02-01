import { test, expect } from "./fixtures/test-fixtures";

test.describe("Home Page", () => {
  test("should display the home page", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
  });

  test("should have correct title", async ({ homePage }) => {
    await homePage.goto();
    const title = await homePage.getTitle();
    expect(title).toContain("Portfolio");
  });
});
