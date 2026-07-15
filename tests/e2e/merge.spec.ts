import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "../fixtures");

test("merging two GPX files combines their points and offers a download", async ({ page }) => {
  await page.goto("/merge");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([path.join(fixturesDir, "sample.gpx"), path.join(fixturesDir, "sample2.gpx")]);

  await expect(page.getByText("sample.gpx")).toBeVisible();
  await expect(page.getByText("sample2.gpx")).toBeVisible();

  // merged: sample.gpx (3 pts) + sample2.gpx (2 pts) = 5 pts
  await expect(page.getByText("5", { exact: true })).toBeVisible();

  const downloadLink = page.getByRole("link", { name: /merged\.gpx/ });
  await expect(downloadLink).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
});

test("a single file shows a prompt to add more before merging", async ({ page }) => {
  await page.goto("/merge");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(fixturesDir, "sample.gpx"));

  await expect(page.getByText("Add at least one more GPX file to merge")).toBeVisible();
  await expect(page.getByRole("link", { name: /merged\.gpx/ })).toHaveCount(0);
});
