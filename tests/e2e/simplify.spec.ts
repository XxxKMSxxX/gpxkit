import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const denseGpxPath = path.join(__dirname, "../fixtures/dense.gpx");

test("simplifying a track reduces its point count and offers a download", async ({ page }) => {
  await page.goto("/simplify");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(denseGpxPath);

  // dense.gpx has 10 points; the default 10m tolerance already reduces it somewhat.
  await expect(page.getByText(/^10 → \d+ points \(\d+% reduction\)/)).toBeVisible();

  const slider = page.locator('input[type="range"]');
  await slider.fill("0");
  await expect(page.getByText("10 → 10 points (0% reduction)")).toBeVisible();

  await slider.fill("40");
  await expect(page.getByText(/^10 → [1-9] points/)).toBeVisible();

  const downloadLink = page.getByRole("link", { name: /simplified\.gpx/ });
  await expect(downloadLink).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
});
