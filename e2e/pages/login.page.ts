import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  // Locators
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    // Use resilient selectors - data-test-id with fallback to standard attributes
    this.form = page.locator('[data-test-id="login-form"], form:has(input#email)').first();
    this.emailInput = page.locator('[data-test-id="login-email-input"], input#email').first();
    this.passwordInput = page.locator('[data-test-id="login-password-input"], input#password').first();
    this.submitButton = page
      .locator('[data-test-id="login-submit-button"], button[type="submit"]:has-text("Zaloguj")')
      .first();
    this.errorAlert = page.locator('[data-test-id="login-error-alert"], [role="alert"]').first();
    this.heading = this.getByRole("heading", { name: "Panel Administracyjny" });
  }

  async goto(): Promise<void> {
    await this.navigate("/admin/login");
    await this.waitForForm();
  }

  async waitForForm(): Promise<void> {
    // Wait for email input which indicates form is loaded (client:only="react")
    await this.emailInput.waitFor({ state: "visible", timeout: 15000 });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorAlert.waitFor({ state: "visible", timeout: 5000 });
      return this.errorAlert.textContent();
    } catch {
      return null;
    }
  }
}
