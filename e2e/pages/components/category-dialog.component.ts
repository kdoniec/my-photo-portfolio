import type { Page, Locator } from "@playwright/test";

export class CategoryDialogComponent {
  // Locators with fallbacks
  readonly dialog: Locator;
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly nameError: Locator;
  readonly slugInput: Locator;
  readonly descriptionInput: Locator;
  readonly descriptionError: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    // Dialog with fallback to role
    this.dialog = page.locator('[data-test-id="category-dialog"], [role="dialog"]:has(input#category-name)').first();
    this.form = page.locator('[data-test-id="category-form"], form:has(input#category-name)').first();
    this.nameInput = page.locator('[data-test-id="category-name-input"], input#category-name').first();
    this.nameError = page.locator('[data-test-id="category-name-error"]').first();
    this.slugInput = page.locator('[data-test-id="category-slug-input"], input#category-slug').first();
    this.descriptionInput = page
      .locator('[data-test-id="category-description-input"], textarea#category-description')
      .first();
    this.descriptionError = page.locator('[data-test-id="category-description-error"]').first();
    this.cancelButton = page
      .locator('[data-test-id="category-dialog-cancel"], [role="dialog"] button:has-text("Anuluj")')
      .first();
    this.submitButton = page
      .locator('[data-test-id="category-dialog-submit"], [role="dialog"] button:has-text("Zapisz")')
      .first();
  }

  async waitForOpen(): Promise<void> {
    await this.nameInput.waitFor({ state: "visible", timeout: 15000 });
  }

  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden", timeout: 10000 });
  }

  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  async fill(data: { name?: string; description?: string }): Promise<void> {
    if (data.name !== undefined) {
      await this.nameInput.fill(data.name);
    }
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getSlugPreview(): Promise<string> {
    return (await this.slugInput.inputValue()) ?? "";
  }

  async getNameError(): Promise<string | null> {
    try {
      await this.nameError.waitFor({ state: "visible", timeout: 2000 });
      return this.nameError.textContent();
    } catch {
      return null;
    }
  }

  async getDescriptionError(): Promise<string | null> {
    try {
      await this.descriptionError.waitFor({ state: "visible", timeout: 2000 });
      return this.descriptionError.textContent();
    } catch {
      return null;
    }
  }

  async isSubmitDisabled(): Promise<boolean> {
    return this.submitButton.isDisabled();
  }
}
