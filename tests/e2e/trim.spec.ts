import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const denseGpxPath = path.join(__dirname, "../fixtures/dense.gpx");

test("trimming a track keeps only the selected point range and offers a download", async ({ page }) => {
  await page.goto("/trim");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(denseGpxPath);

  // dense.gpx has 10 points; the range defaults to the full track.
  await expect(page.getByText("Keeping 10 of 10 points")).toBeVisible();

  const sliders = page.locator('input[type="range"]');
  await sliders.nth(0).fill("2");
  await sliders.nth(1).fill("5");

  await expect(page.getByText("Keeping 4 of 10 points")).toBeVisible();

  const downloadLink = page.getByRole("link", { name: /trimmed\.gpx/ });
  await expect(downloadLink).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
});
