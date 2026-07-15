import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleGpxPath = path.join(__dirname, "../fixtures/sample.gpx");

test("dropping a GPX file renders stats and the track on the map", async ({ page }) => {
  await page.goto("/view");

  await expect(page.getByText("Drag & drop a GPX file")).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(sampleGpxPath);

  // Stats derived from tests/fixtures/sample.gpx (3 points, +5m/-7m elevation, 10 min).
  await expect(page.getByText("0.29 km")).toBeVisible();
  await expect(page.getByText("+5 m")).toBeVisible();
  await expect(page.getByText("-7 m")).toBeVisible();
  await expect(page.getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByText("10m", { exact: true })).toBeVisible();

  // MapLibre renders into a <canvas> inside the map container.
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
});

test("an invalid file shows an error instead of crashing", async ({ page }) => {
  await page.goto("/view");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "broken.gpx",
    mimeType: "application/gpx+xml",
    buffer: Buffer.from("not xml at all"),
  });

  await expect(page.getByRole("alert")).toContainText("Failed to parse GPX file");
});
