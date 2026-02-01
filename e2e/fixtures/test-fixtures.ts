/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { HomePage } from "../pages/home.page";
import { LoginPage } from "../pages/login.page";
import { CategoriesPage } from "../pages/categories.page";

interface Fixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  categoriesPage: CategoriesPage;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  categoriesPage: async ({ page }, use) => {
    const categoriesPage = new CategoriesPage(page);
    await use(categoriesPage);
  },
});

export { expect } from "@playwright/test";
