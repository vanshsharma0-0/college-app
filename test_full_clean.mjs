import { chromium } from 'playwright';

async function run() {
  console.log("Starting Full Flow Verification with Explicit IDs...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto("http://localhost:3000");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");

  // 1. Open Storage Clean-Up modal via DeveloperCard
  const adminBtn = page.locator("button:has-text('Admin / Storage')").first();
  await adminBtn.click();
  await page.waitForSelector("text=Developer Security Verification");

  // Enter PIN 2026
  await page.fill("input[placeholder*='Developer PIN']", "2026");
  await page.click("button:has-text('Unlock Storage')");
  await page.waitForSelector("text=Developer & Admin Panel: Manage Submissions & Storage");
  console.log("✓ Storage Console unlocked with PIN 2026!");

  // Verify columns and delete
  const initialRows = await page.locator("table tbody tr").count();
  console.log(`✓ Initial storage submissions listed: ${initialRows}`);

  // Test single delete
  const delBtn = page.locator("button:has-text('Delete Submission')").first();
  await delBtn.click();
  const confirmBtn = page.locator("button:has-text('Confirm')").first();
  await confirmBtn.click();
  await page.waitForSelector("text=permanently deleted. Storage reclaimed");
  console.log("✓ Single submission deleted and storage reclaimed!");

  // Close console
  await page.click("button:has-text('Close Console')");
  await page.waitForTimeout(300);

  // 2. Switch to Teacher Sign In tab using explicit ID #teacher-tab-btn
  await page.click("#teacher-tab-btn");
  await page.waitForSelector("#teacher-username");
  await page.fill("#teacher-username", "hod_admin");
  await page.fill("#teacher-password", "hod@123");
  await page.click("#teacher-submit-btn");

  // Verify Teacher Portal loads
  await page.waitForSelector("text=Section 2: Student Answer Submissions");
  console.log("✓ Logged into Teacher Portal as HOD Administrator!");

  // Verify header has "Manage Submissions & Storage" button
  const headerBtn = page.locator("button:has-text('Manage Submissions & Storage')");
  await headerBtn.waitFor({ state: 'visible' });
  await headerBtn.click();
  await page.waitForSelector("text=Developer & Admin Panel: Manage Submissions & Storage");
  console.log("✓ Opened Manage Submissions & Storage modal directly from Teacher Portal header!");

  await page.click("button:has-text('Close Console')");
  console.log("✓ Closed storage console in Teacher Portal");

  // Sign out teacher
  await page.click("button:has-text('Sign Out'), button:has-text('Logout')");
  await page.waitForSelector("#student-tab-btn");
  console.log("✓ Signed out successfully!");

  console.log("\n========================================================");
  console.log("ALL FLOWS AND STORAGE ACTIONS VERIFIED 100%!");
  console.log("========================================================");

  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
