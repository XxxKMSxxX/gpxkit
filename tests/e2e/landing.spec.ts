import { test, expect } from "@playwright/test";

test("landing page links to each tool", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("GPS tracks");

  await expect(page.getByRole("link", { name: /Open the viewer/ })).toHaveAttribute("href", "/view");
  await expect(page.getByRole("link", { name: "View", exact: false }).first()).toHaveAttribute(
    "href",
    "/view",
  );
  await expect(page.getByRole("link", { name: "Merge", exact: false }).first()).toHaveAttribute(
    "href",
    "/merge",
  );
  await expect(page.getByRole("link", { name: "Simplify", exact: false }).first()).toHaveAttribute(
    "href",
    "/simplify",
  );
  await expect(page.getByRole("link", { name: "Trim", exact: false }).first()).toHaveAttribute(
    "href",
    "/trim",
  );
});
