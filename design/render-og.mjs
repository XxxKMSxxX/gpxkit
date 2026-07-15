import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("http://localhost:8935/og-image.html");
await page.waitForTimeout(300);
await page.screenshot({ path: "/Users/kimurashun/workspace/side-job-idea/gpxkit/design/og-image.png" });
await browser.close();
console.log("done");
