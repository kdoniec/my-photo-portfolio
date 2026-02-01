import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.getByLabel("Email");
    this.passwordInput = this.getByLabel("Hasło");
    this.submitButton = this.getByRole("button", { name: "Zaloguj" });
    this.errorMessage = this.getByRole("alert");
    this.heading = this.getByRole("heading", { name: "Panel Administracyjny" });
  }

  async goto(): Promise<void> {
    await this.navigate("/admin/login");
    await this.waitForPageLoad();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }
}
