import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { CategoryDialogComponent } from "./components/category-dialog.component";
import { DeleteCategoryDialogComponent } from "./components/delete-category-dialog.component";

export class CategoriesPage extends BasePage {
  // Components
  readonly categoryDialog: CategoryDialogComponent;
  readonly deleteDialog: DeleteCategoryDialogComponent;

  // Locators with fallbacks
  readonly manager: Locator;
  readonly header: Locator;
  readonly addCategoryButton: Locator;
  readonly limitAlert: Locator;
  readonly grid: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize components
    this.categoryDialog = new CategoryDialogComponent(page);
    this.deleteDialog = new DeleteCategoryDialogComponent(page);

    // Initialize locators with fallbacks
    this.manager = page
      .locator('[data-test-id="categories-manager"], .space-y-6:has(h2:has-text("kategoriami"))')
      .first();
    this.header = page.locator('[data-test-id="categories-header"]').first();
    this.addCategoryButton = page
      .locator('[data-test-id="add-category-button"], button:has-text("Dodaj kategorię")')
      .first();
    this.limitAlert = page.locator('[data-test-id="categories-limit-alert"]').first();
    this.grid = page.locator('[data-test-id="categories-grid"]').first();
    this.emptyState = page.locator('[data-test-id="categories-empty-state"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate("/admin/categories");
    await this.waitForPageLoad();
  }

  async waitForManager(): Promise<void> {
    // Wait for either the manager or the add button to be visible
    await this.addCategoryButton.waitFor({ state: "visible", timeout: 15000 });
  }

  // Category cards
  getCategoryCards(): Locator {
    return this.page.locator('[data-test-id="category-card"]');
  }

  getCategoryCardByIndex(index: number): Locator {
    return this.getCategoryCards().nth(index);
  }

  async getCategoryCount(): Promise<number> {
    // Check if grid exists first
    const gridVisible = await this.grid.isVisible().catch(() => false);
    if (!gridVisible) {
      return 0;
    }
    return this.getCategoryCards().count();
  }

  async hasCategories(): Promise<boolean> {
    return this.grid.isVisible();
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isLimitReached(): Promise<boolean> {
    return this.limitAlert.isVisible();
  }

  async isAddButtonDisabled(): Promise<boolean> {
    return this.addCategoryButton.isDisabled();
  }

  // Actions
  async clickAddCategory(): Promise<void> {
    // Ensure button is ready for interaction
    await this.addCategoryButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(500); // Small delay for React hydration
    await this.addCategoryButton.click();
    await this.categoryDialog.waitForOpen();
  }

  async editCategoryByIndex(index: number): Promise<void> {
    const card = this.getCategoryCardByIndex(index);
    await card.locator('[data-test-id="edit-category-button"], button:has-text("Edytuj")').first().click();
    await this.categoryDialog.waitForOpen();
  }

  async deleteCategoryByIndex(index: number): Promise<void> {
    const card = this.getCategoryCardByIndex(index);
    await card.locator('[data-test-id="delete-category-button"], button:has-text("Usuń")').first().click();
    await this.deleteDialog.waitForOpen();
  }

  // Combined flows
  async createCategory(data: { name: string; description?: string }): Promise<void> {
    await this.clickAddCategory();
    await this.categoryDialog.fill(data);
    await this.categoryDialog.submit();
    await this.categoryDialog.waitForClose();
  }

  async editCategory(index: number, data: { name?: string; description?: string }): Promise<void> {
    await this.editCategoryByIndex(index);
    await this.categoryDialog.fill(data);
    await this.categoryDialog.submit();
    await this.categoryDialog.waitForClose();
  }

  async deleteCategory(index: number): Promise<void> {
    await this.deleteCategoryByIndex(index);
    await this.deleteDialog.confirm();
    await this.deleteDialog.waitForClose();
  }
}
