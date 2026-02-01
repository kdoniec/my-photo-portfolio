import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly gallerySection: Locator;
  readonly categoryNav: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.getByRole("heading", { level: 1 });
    this.gallerySection = this.getByTestId("gallery-section");
    this.categoryNav = this.getByRole("navigation", { name: /categories/i });
  }

  async goto(): Promise<void> {
    await this.navigate("/");
    await this.waitForPageLoad();
  }

  async selectCategory(categoryName: string): Promise<void> {
    await this.categoryNav.getByText(categoryName).click();
  }

  async getPhotoCount(): Promise<number> {
    const photos = this.gallerySection.locator("[data-testid='photo-item']");
    return photos.count();
  }
}
