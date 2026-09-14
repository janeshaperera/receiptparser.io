import { test, expect } from "@playwright/test";
import path from "path";

const timestamp = Date.now();
const testEmail = `e2e_user_${timestamp}@receiptparser.local`;
const testPassword = "StrongPassword123!";
const testName = "Playwright Test User";

const sampleReceiptPath = path.resolve(__dirname, "fixtures/sample-receipt.png");
const invalidFilePath = path.resolve(__dirname, "fixtures/invalid-file.txt");
const tooLargeFilePath = path.resolve(__dirname, "fixtures/too-large-receipt.png");

// Main End-to-End User Flow (Executed Serially)
test.describe.serial("ReceiptParser.io - Complete User Journey", () => {
  // 1. Homepage loads
  test("1. Homepage loads with clear hero and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ReceiptParser\.io/i);
    await expect(page.locator("h1")).toContainText(/Turn receipts into/i);
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Account/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign In/i }).first()).toBeVisible();
  });

  // 2. Signup page opens
  test("2. Signup page opens from navbar or hero CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Create Account/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator("h1")).toContainText(/Create your Account/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  // 3. Create a test account and auto-redirect to dashboard
  test("3. Create a test account and auto-redirect to dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.locator('input[placeholder="Jane Doe"]').fill(testName);
    await page.locator('input[type="email"]').fill(testEmail);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(testPassword);
    await passwordInputs.nth(1).fill(testPassword);

    await page.getByRole("button", { name: /Create Account/i }).click();

    // After signup, user is automatically redirected to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#upload-box")).toBeVisible();
    await expect(page.getByRole("button", { name: /Turn Receipt Into Structured Data/i })).toBeVisible();
  });

  // 4. Upload receipt on dashboard, extract real data, verify fields, test exports & usage update
  test("4. Upload receipt on dashboard, extract real data, verify fields, test exports & usage update", async ({ page }) => {
    // Log in with the created test account
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("#upload-box")).toBeVisible();

    // 6. Upload bundled sample receipt directly into input[data-testid='file-input']
    await page.locator('input[data-testid="file-input"]').setInputFiles(sampleReceiptPath);

    // Verify ready to parse is shown
    await expect(page.getByText("Ready to parse", { exact: true })).toBeVisible();

    // 7. Click Turn Receipt Into Structured Data and wait for /v1/parse response
    const parseResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/v1/parse") && res.request().method() === "POST"
    );

    await page.getByRole("button", { name: /Turn Receipt Into Structured Data/i }).click();

    // 8. Verify extraction succeeds with HTTP 200
    const parseResponse = await parseResponsePromise;
    expect(parseResponse.status()).toBe(200);
    const parsedData = await parseResponse.json();

    // 9. Verify extracted merchant/vendor is visible on screen
    const expectedMerchant = parsedData.vendor_name || parsedData.data?.vendor_name;
    expect(expectedMerchant).toBeTruthy();
    await expect(page.getByText(expectedMerchant)).toBeVisible({ timeout: 10000 });

    // 10. Verify date is visible
    const expectedDate = parsedData.date || parsedData.data?.date;
    if (expectedDate) {
      await expect(page.getByText(expectedDate)).toBeVisible();
    }

    // 11. Verify line items are visible
    const lineItems = parsedData.line_items || parsedData.data?.line_items || [];
    if (lineItems.length > 0) {
      await expect(page.getByText(lineItems[0].description)).toBeVisible();
    }

    // 12. Verify subtotal/tax/total are visible
    const total = parsedData.total ?? parsedData.data?.total;
    if (total !== undefined) {
      await expect(page.getByText(new RegExp(Number(total).toFixed(2))).first()).toBeVisible();
    }

    // 13. Verify JSON export works
    const jsonDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export JSON/i }).click();
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/i);

    // 14. Verify CSV export works
    const csvDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export CSV/i }).click();
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/i);

    // 15. Verify usage counter updates (used count increases)
    await expect(page.locator("section:has-text('Monthly Usage')")).toContainText(/1 of 20 receipts used/i, {
      timeout: 10000
    });
  });

  // 5. Logout, Login again, and verify dashboard persists user session and quota
  test("5. Logout, Login again, and verify dashboard persists user session and quota", async ({ page }) => {
    // Log in
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 16. Logout
    await page.getByRole("button", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Verify visiting /dashboard without session redirects to /login
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // 17. Login again
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    // 18. Verify dashboard still works
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
    await expect(page.getByText(testEmail)).toBeVisible();
    await expect(page.locator("section:has-text('Monthly Usage')")).toBeVisible();
    await expect(page.locator("section:has-text('Monthly Usage')")).toContainText(/1 of 20 receipts used/i);
  });

  // 6. Failure Case: Invalid file type is rejected in UI before uploading
  test("6. Failure Case: Invalid file type is rejected in UI before uploading", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Upload invalid file type (.txt)
    await page.locator('input[data-testid="file-input"]').setInputFiles(invalidFilePath);

    await expect(page.getByText(/We can't read this file type/i)).toBeVisible();
  });

  // 7. Failure Case: File larger than allowed limit (10MB) is rejected
  test("7. Failure Case: File larger than allowed limit (10MB) is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Upload oversized file (> 10MB)
    await page.locator('input[data-testid="file-input"]').setInputFiles(tooLargeFilePath);

    await expect(page.getByText(/File exceeds 10 MB limit/i)).toBeVisible();
  });
});

// Independent Edge Cases and Security Validations
test.describe("ReceiptParser.io - Edge Cases and Validation", () => {
  test("8. Failure Case: Invalid login credentials show friendly error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(`nonexistent_${Date.now()}@example.com`);
    await page.locator('input[type="password"]').fill("CompletelyWrongPassword123!");
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("9. Failure Case: Missing authentication redirects protected dashboard to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("10. Failure Case: Direct API call without auth header returns 401 MISSING_API_KEY", async ({ request }) => {
    const res = await request.post("http://localhost:10000/v1/parse");
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error?.code).toBe("MISSING_API_KEY");
  });
});
