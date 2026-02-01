import type { Page, Locator } from "@playwright/test";

export class DeleteCategoryDialogComponent {
  private readonly page: Page;

  // Locators
  readonly dialog: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("delete-category-dialog");
    this.cancelButton = page.getByTestId("delete-category-cancel");
    this.confirmButton = page.getByTestId("delete-category-confirm");
  }

  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
  }

  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden" });
  }

  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
