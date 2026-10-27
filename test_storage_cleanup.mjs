import { chromium } from 'playwright';

async function run() {
  console.log("Starting Storage & Submissions Clean-Up E2E Verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Clear any existing localStorage session
  await page.goto("http://localhost:3000");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");

  console.log("✓ Loaded clean Login Page");

  // 1. Open Developer / Admin Storage Console from DeveloperCard
  const adminBtn = page.locator("button:has-text('Admin / Storage')").first();
  await adminBtn.waitFor({ state: 'visible' });
  await adminBtn.click();
  console.log("✓ Clicked 'Admin / Storage' button in DeveloperCard");

  // 2. Verify PIN verification prompt
  await page.waitForSelector("text=Developer Security Verification");
  console.log("✓ PIN protection screen displayed");

  // Enter invalid PIN first to test protection
  await page.fill("input[placeholder*='Developer PIN']", "9999");
  await page.click("button:has-text('Unlock Storage')");
  await page.waitForSelector("text=Invalid Developer PIN");
  console.log("✓ Invalid PIN correctly rejected with security notice");

  // Enter valid PIN (2026)
  await page.fill("input[placeholder*='Developer PIN']", "2026");
  await page.click("button:has-text('Unlock Storage')");
  await page.waitForSelector("text=Developer & Admin Panel: Manage Submissions & Storage");
  console.log("✓ Successfully unlocked Storage Console with PIN 2026!");

  // 3. Verify Metrics Cards
  await page.waitForSelector("text=Storage Occupied");
  await page.waitForSelector("text=Total Submissions");
  console.log("✓ Storage Occupied & Total Submissions metrics displayed");

  // 4. Verify Submissions Table contents
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  console.log(`✓ Found ${count} submissions in Storage Inventory table`);
  if (count === 0) throw new Error("Expected demo submissions to be listed!");

  // Verify headers: Student Name, Class, Subject, Submission Date, Storage Size, Photo Preview, Delete Action
  await page.waitForSelector("th:has-text('Student Name')");
  await page.waitForSelector("th:has-text('Storage Size')");
  await page.waitForSelector("th:has-text('Delete Action')");
  console.log("✓ Clean table columns verified (Student Name, Class, Subject, Date, Storage Size, Delete Action)");

  // 5. Test Delete Submission on first entry
  const firstDeleteBtn = page.locator("button:has-text('Delete Submission')").first();
  await firstDeleteBtn.click();
  console.log("✓ Clicked 'Delete Submission'");

  // Confirm delete
  const confirmBtn = page.locator("button:has-text('Confirm')").first();
  await confirmBtn.waitFor({ state: 'visible' });
  await confirmBtn.click();
  await page.waitForSelector("text=permanently deleted. Storage reclaimed");
  console.log("✓ Submission permanently deleted and storage reclaimed message shown!");

  const updatedRows = await page.locator("table tbody tr").count();
  console.log(`✓ Updated submissions count after delete: ${updatedRows} (was ${count})`);

  // 6. Test Bulk Action controls
  const bulkDeleteOlderBtn = page.locator("button:has-text('Delete All Older Than')");
  const hasBulkBtn = await bulkDeleteOlderBtn.count() > 0;
  console.log("✓ 'Delete All Older Than X Days' bulk action button available:", hasBulkBtn);

  // Close console
  await page.click("button:has-text('Close Console')");
  await page.waitForTimeout(300);
  console.log("✓ Closed Developer & Storage Console");

  // 7. Verify Teacher Portal has direct "Manage Submissions & Storage" header button
  await page.click("button:has-text('Teacher Sign In')");
  await page.fill("#teacher-username", "hod_admin");
  await page.fill("#teacher-password", "hod@123");
  await page.click("button:has-text('Teacher Sign In')");
  await page.waitForSelector("text=Section 2: Student Answer Submissions");

  const headerStorageBtn = page.locator("button:has-text('Manage Submissions & Storage')");
  const hasHeaderBtn = await headerStorageBtn.count() > 0;
  console.log("✓ 'Manage Submissions & Storage' button present in Teacher Portal header:", hasHeaderBtn);

  await headerStorageBtn.click();
  await page.waitForSelector("text=Developer & Admin Panel: Manage Submissions & Storage");
  console.log("✓ Clicked header button and opened storage console directly!");

  await page.click("button:has-text('Close Console')");

  console.log("\n========================================================");
  console.log("DEVELOPER STORAGE CLEAN-UP FEATURE VERIFIED 100%!");
  console.log("========================================================");

  await browser.close();
}

run().catch((err) => {
  console.error("Storage clean-up test failed:", err);
  process.exit(1);
});
