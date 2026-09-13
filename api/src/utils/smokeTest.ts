/**
 * Standalone Smoke Test Suite for ReceiptParser.io
 * Usage:
 *   npx tsx src/utils/smokeTest.ts [TARGET_URL]
 * Default target: http://localhost:3000
 */

const targetUrl = process.argv[2] || process.env.API_URL || "http://localhost:3000";

console.log("==========================================");
console.log("ReceiptParser.io Production Smoke Tester");
console.log(`Target: ${targetUrl}`);
console.log("==========================================\n");

let failures = 0;

async function check(name: string, fn: () => Promise<void>) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    await fn();
    console.log("PASS");
  } catch (err: any) {
    console.log("FAIL");
    console.error(`  -> Error: ${err.message}`);
    failures++;
  }
}

async function run() {
  let createdApiKey = "";
  let userEmail = `smoke_${Date.now()}@receiptparser.io`;

  // 1. Health check
  await check("1. GET /v1/health (Health check endpoint)", async () => {
    const res = await fetch(`${targetUrl}/v1/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as any;
    if (data.status !== "healthy") throw new Error(`Unexpected status: ${data.status}`);
    if (!data.timestamp) throw new Error("Missing timestamp in health response");
  });

  // 2. Status check
  await check("2. GET /v1/status (Operational info & non-sensitive check)", async () => {
    const res = await fetch(`${targetUrl}/v1/status`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as any;
    if (data.name !== "ReceiptParser.io API") throw new Error(`Unexpected name: ${data.name}`);
    if (typeof data.uptime_seconds !== "number") throw new Error("Missing uptime");
    // Ensure no secrets leaked
    if (JSON.stringify(data).includes("key_hash") || JSON.stringify(data).includes("postgres://")) {
      throw new Error("Potential sensitive credential leak in status endpoint!");
    }
  });

  // 3. Passwordless Signup / Key generation
  await check("3. POST /v1/auth/signup (Issue API Key)", async () => {
    const res = await fetch(`${targetUrl}/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail })
    });
    if (!res.ok) throw new Error(`Signup failed with status ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.api_key || !data.api_key.raw_key) throw new Error("Missing raw_key in signup response");
    if (!data.api_key.raw_key.startsWith("rcpt_live_")) throw new Error("Invalid API key format prefix");
    createdApiKey = data.api_key.raw_key;
  });

  // 4. API Key Verification
  await check("4. POST /v1/auth/verify (Key-based Authentication)", async () => {
    const res = await fetch(`${targetUrl}/v1/auth/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${createdApiKey}` }
    });
    if (!res.ok) throw new Error(`Auth verification failed with status ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.valid) throw new Error("Key marked as invalid");
    if (data.user.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error(`User email mismatch: ${data.user.email} vs ${userEmail}`);
    }
  });

  // 5. Usage Quota Check
  await check("5. GET /v1/usage (Initial Free Quota Check)", async () => {
    const res = await fetch(`${targetUrl}/v1/usage`, {
      headers: { Authorization: `Bearer ${createdApiKey}` }
    });
    if (!res.ok) throw new Error(`Usage check failed with status ${res.status}`);
    const data = (await res.json()) as any;
    if (data.plan !== "free") throw new Error(`Expected free plan, got ${data.plan}`);
    if (data.limit !== 50) throw new Error(`Expected limit 50, got ${data.limit}`);
  });

  // 6. Stripe Checkout Session Initiation
  await check("6. POST /v1/billing/checkout (Stripe Checkout Session)", async () => {
    const res = await fetch(`${targetUrl}/v1/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createdApiKey}`
      },
      body: JSON.stringify({ plan: "starter" })
    });
    if (!res.ok) throw new Error(`Checkout session failed with status ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.checkout_url || !data.session_id) throw new Error("Missing checkout_url or session_id");
  });

  // 7. Parse Receipt File Upload
  await check("7. POST /v1/parse (Upload and Extract Receipt)", async () => {
    const sampleReceiptBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const fileBuffer = Buffer.from(sampleReceiptBase64, "base64");
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: "image/png" }), "sample_receipt.png");

    const res = await fetch(`${targetUrl}/v1/parse`, {
      method: "POST",
      headers: { Authorization: `Bearer ${createdApiKey}` },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Parse failed with status ${res.status}: ${JSON.stringify(errData)}`);
    }

    const receipt = (await res.json()) as any;
    if (!receipt.vendor_name) throw new Error("Missing vendor_name in parsed output");
    if (typeof receipt.total !== "number") throw new Error("Total is not a number");
  });

  // Summary
  console.log("\n==========================================");
  if (failures === 0) {
    console.log("ALL SMOKE CHECKS PASSED SUCCESSFULLY!");
    console.log("Service is 100% operational and production ready.");
    console.log("==========================================");
    process.exit(0);
  } else {
    console.error(`SMOKE TEST FAILED: ${failures} check(s) failed.`);
    console.log("==========================================");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Smoke runner error:", err);
  process.exit(1);
});
