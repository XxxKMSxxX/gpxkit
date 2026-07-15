import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.goto("http://localhost:8935/favicon.html");
await page.waitForTimeout(200);
await page.screenshot({ path: "/Users/kimurashun/workspace/side-job-idea/gpxkit/design/favicon-512.png", omitBackground: true });
await browser.close();
console.log("done");
