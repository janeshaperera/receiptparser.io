# ReceiptParser.io

**ReceiptParser.io** is a self-service, developer-first REST API that accepts receipt or invoice images (JPEG, PNG, WEBP) and PDFs, and extracts structured financial JSON using Google Gemini Vision, with built-in Stripe subscription billing and usage quota metering.

Targeted for US developers, expense-management software, bookkeeping platforms, and SaaS products requiring self-service receipt extraction.

---

## How to Run ReceiptParser.io (Windows 11)

Running ReceiptParser.io requires **zero terminal commands**:

1. **Double-click `START_RECEIPTPARSER.bat`** in the project root folder.
2. Your default browser will **open automatically** to **[http://localhost:3001](http://localhost:3001)**.
3. **Use the website** to upload receipts, view structured data, or explore developer docs.

> Both the backend API (`http://localhost:10000`) and the Next.js frontend (`http://localhost:3001`) start automatically in their own dedicated command windows and remain running until you close them.

---

## Alternative / Individual Launch Scripts

If you prefer to start services individually, two standalone scripts are also provided in the project root:
- **`start-local.bat`**: Starts only the Express + TypeScript API on `http://localhost:10000`.
- **`start-web.bat`**: Starts only the Next.js frontend on `http://localhost:3001`.

---

### 2. Open the project folder
Open PowerShell, Command Prompt, or terminal and navigate to the project:
```bash
cd "C:\Users\janes\.gemini\antigravity\scratch\project m\receiptparser"
```

### 3. Create `.env` from `.env.example`
In `receiptparser/api/`, create your `.env` file:
```bash
cd api
copy .env.example .env
```

### 4. Add your configuration values in `api/.env`
Open `api/.env` in any text editor and fill in your values:
- **`DATABASE_URL`**: Your Supabase connection string:
  `postgresql://postgres.wwntcjjyjvpxyifdabug:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
- **`GEMINI_API_KEY`**: Your Google Gemini API Key from Google AI Studio.
- **`PORT`**: `10000` (defaults to 10000).
- **`WEB_ORIGIN`**: `http://localhost:3000,http://localhost:3001`
- **Stripe values**: Leave default or mock values for demonstration without real charges.

### 5. Start the API Server

**Option A (One-Click Windows Script):**
From the `receiptparser\` folder, double-click or run:
```cmd
start-local.bat
```

**Option B (Manual Commands):**
```bash
cd api
npm install --include=dev
npm run build
npm start
```
The server will start at: **http://localhost:10000**

### 6. Test `/v1/health`
Open your browser or run:
```bash
curl http://localhost:10000/v1/health
```
You will receive:
```json
{"status":"healthy","timestamp":"..."}
```

### 7. Open the Frontend Web Application
In a second terminal window, run:
```bash
cd web
npm install
npm run dev
```
*(Or double-click `start-web.bat`)*

Then open your browser to **http://localhost:3001** to view the landing page, create an API key, and test receipts!

---

```
                       ┌─────────────────────────┐
                       │      End Customer       │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │   Vercel (Next.js Web)  │
                       │ https://receiptparser.io│
                       └────────────┬────────────┘
                                    │ HTTP REST
                                    ▼
                       ┌─────────────────────────┐
                       │   Render (Node.js API)  │
                       │ https://api.receiptparser.io
                       └─────┬──────────────┬────┘
                             │              │
        PostgreSQL / Supabase│              │ Gemini 2.5 Flash / Stripe Webhooks
                             ▼              ▼
                       ┌───────────┐  ┌──────────────────┐
                       │  Supabase │  │ Google Gemini AI │
                       │ Database  │  │ Stripe Payments  │
                       └───────────┘  └──────────────────┘
```

---

## Directory Structure

```
receiptparser/
├── api/                    # Express + TypeScript REST API (Render-ready)
│   ├── src/
│   │   ├── config/         # Centralized environment & app settings
│   │   ├── controllers/    # Request handlers (auth, parse, usage, billing, health)
│   │   ├── db/             # PostgreSQL client, schema.sql, repositories & migrate.ts
│   │   ├── middleware/     # Auth, error handling, rate limiting, plan quota, multer
│   │   ├── routes/         # Versioned REST routes (/v1/...)
│   │   ├── schemas/        # Zod schemas for structured responses, billing, & errors
│   │   ├── services/       # Gemini, API key, parse pipeline, Stripe & Webhook services
│   │   └── utils/          # Date normalizer, magic bytes, math consistency, smokeTest.ts
│   └── tests/              # Comprehensive 50-test Jest + Supertest suite
├── web/                    # Next.js App Router (Vercel-ready)
│   ├── src/
│   │   ├── app/            # Landing, dashboard, login, signup, recovery, docs
│   │   ├── components/     # CodeTabs, JsonViewer, TryItWidget, UsageChart, Nav, Footer
│   │   └── lib/            # api.ts fetch client, auth session storage
│   ├── tests/              # Web component Jest + RTL suite
│   └── vercel.json         # Vercel security headers and framework config
├── render.yaml             # Render deployment blueprint for API
├── .env.example            # Master environment variable template
└── README.md
```

---

## Plans & Usage Quotas

ReceiptParser.io is 100% self-service with automated plan enforcement:

| Plan | Price | Monthly Quota | Features |
| :--- | :--- | :--- | :--- |
| **Free** | $0 / mo | **50 requests / month** | No credit card required |
| **Starter** | $29 / mo | **1,000 requests / month** | Self-service upgrade via Stripe |
| **Pro** | $99 / mo | **10,000 requests / month** | Priority throughput |

### Quota Metering Rules:
- Quota counts API parse requests (`POST /v1/parse`), not individual line items.
- Only successful requests (`status = 'SUCCESS'`) count toward the calendar month quota.
- When a user reaches their monthly limit, `POST /v1/parse` returns HTTP 429 `PLAN_LIMIT_EXCEEDED` and immediately halts execution without calling Gemini.

---

## Production Deployment Playbook

Follow this step-by-step guide to deploy ReceiptParser.io to production on **Supabase**, **Render**, and **Vercel**.

### Step 1: Database Setup on Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** > **Database** and copy your **Connection String (URI)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Run the schema migrations:
   - **Option A (Automated CLI)**:
     ```bash
     cd receiptparser/api
     DATABASE_URL="your-supabase-connection-string" npm run db:migrate
     ```
   - **Option B (Supabase SQL Editor)**:
     Copy and paste the contents of `receiptparser/api/src/db/schema.sql` into the Supabase SQL Editor and click **Run**.
4. Supabase creates the following tables:
   - `users`: User accounts with plans and Stripe references.
   - `api_keys`: Hashed API keys (`rcpt_live_...`), prefix index, and billing references.
   - `usage_logs`: Request records, file metrics, execution durations, and status codes.
   - `processed_webhook_events`: Idempotency tracking table for Stripe webhooks.

---

### Step 2: REST API Deployment on Render

1. Push your code to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml`.
4. Configure the environment variables in Render:
   - `DATABASE_URL`: Your Supabase connection string.
   - `GEMINI_API_KEY`: Your production API key from Google AI Studio.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `STRIPE_SECRET_KEY`: `sk_live_...` (from Stripe Dashboard)
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...` (configured in Step 3)
   - `STRIPE_STARTER_PRICE_ID`: `price_...` (recurring starter product)
   - `STRIPE_PRO_PRICE_ID`: `price_...` (recurring pro product)
   - `WEB_ORIGIN`: `https://receiptparser.io` (your Vercel frontend domain)
   - `MOCK_DB`: `false`
   - `MOCK_LLM`: `false`
   - `MOCK_STRIPE`: `false`
5. Render will automatically execute:
   - Build: `npm install && npm run build`
   - Pre-Deploy: `npm run db:migrate`
   - Start: `npm start`
   - Health Check: `/v1/health`

---

### Step 3: Stripe Webhook Configuration

1. In the [Stripe Dashboard](https://dashboard.stripe.com), navigate to **Developers** > **Webhooks**.
2. Click **Add endpoint**.
3. Set the Endpoint URL to your Render API domain:
   ```
   https://api.receiptparser.io/v1/billing/webhook
   ```
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Reveal the **Signing secret** (`whsec_...`) and update the `STRIPE_WEBHOOK_SECRET` environment variable in your Render Dashboard.

---

### Step 4: Web Application Deployment on Vercel

1. In the [Vercel Dashboard](https://vercel.com), click **Add New** > **Project**.
2. Select your repository and set the **Root Directory** to `receiptparser/web`.
3. Framework Preset: **Next.js** (detected automatically).
4. Add the following Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://api.receiptparser.io`
5. Click **Deploy**. Vercel will build and deploy the Next.js App Router application with security headers defined in `vercel.json`.

---

### Step 5: Post-Deployment Smoke Test

Once both services are running, verify the deployment:

```bash
cd receiptparser/api
npm run smoke -- https://api.receiptparser.io
```

The smoke runner executes:
1. `GET /v1/health` — Confirms 200 OK and database health.
2. `GET /v1/status` — Verifies uptime and zero credential leakage.
3. `POST /v1/auth/signup` — Issues a production API key.
4. `POST /v1/auth/verify` — Validates Bearer authentication.
5. `GET /v1/usage` — Validates initial 50-request free plan quota.
6. `POST /v1/billing/checkout` — Generates a live Stripe Checkout URL.
7. `POST /v1/parse` — Validates real OCR extraction with structured JSON output.

---

## Local Development & Testing

### Running Tests:
- **API Tests (50/50 Jest + Supertest)**:
  ```bash
  cd receiptparser/api
  npm test
  ```
- **Web Tests (9/9 Jest + RTL)**:
  ```bash
  cd receiptparser/web
  npm test
  ```

### Running Offline Development:
Set the following in `receiptparser/api/.env`:
```ini
MOCK_DB=true
MOCK_LLM=true
MOCK_STRIPE=true
```
Run both servers:
```bash
# Terminal 1: API
cd receiptparser/api && npm run dev

# Terminal 2: Web
cd receiptparser/web && npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## How we verify releases

ReceiptParser.io uses an **independent, automated CI/CD release-gate system** (`.github/workflows/receiptparser-ci.yml`) that executes on every push to `main` and all pull requests. 

A deployment is **never** considered successful merely because code builds or mock functions return static data. Every release candidate is spun up from a clean Ubuntu environment and verified by driving an actual Chromium browser against the live application.

### The 24 Release Gate Checkpoints:

1. **Clean Environment Isolation**: Each pipeline runs inside a clean GitHub Actions runner with fresh dependencies (`npm ci`).
2. **Secret Leak Detection**: Pre-build repository scan to ensure zero committed `.env` secrets, credentials, or private tokens.
3. **Dependency Security Audit**: Runs `npm audit` on both API and Web packages.
4. **API TypeScript Compilation**: Strictly compiles backend code via `tsc` to enforce complete type safety.
5. **Web Next.js Production Build**: Builds optimized static & App Router production assets.
6. **Backend Unit & Integration Suite**: Executes 60 Jest tests covering all controllers, repositories, rate-limiters, and edge cases.
7. **Quota Check Before AI**: Verifies that requests exceeding plan quotas (`429 PLAN_LIMIT_EXCEEDED`) are blocked *before* Gemini Vision or OCR APIs are invoked.
8. **Live API Background Launch**: Launches the compiled API server on `http://localhost:10000` and polls `GET /v1/health` until ready.
9. **Live Web Background Launch**: Launches the compiled Next.js server on `http://localhost:3001` and polls until responsive.
10. **Headless Chromium Browser Automation**: Boots Playwright browser instances without synthetic mocking of DOM elements.
11. **Isolated Account Registration**: Creates an isolated test account with dynamic timestamp email and password.
12. **Automatic Session Redirection**: Verifies the user is redirected to `/dashboard` with session tokens securely stored.
13. **Dashboard Access & State Rehydration**: Verifies navigation, quota banners, and dashboard components render properly.
14. **Real File Upload through Actual UI**: Attaches a bundled receipt fixture (`sample-receipt.png`) directly into the UI file uploader.
15. **Real `/v1/parse` Network Request**: Waits for and asserts that the live `POST /v1/parse` HTTP request succeeds with status 200.
16. **Visible Merchant Extraction**: Confirms that extracted vendor name (e.g. `WHOLE FOODS MARKET`) is visible on the webpage.
17. **Visible Transaction Date**: Confirms date parsing is rendered to the user.
18. **Visible Line Items & Pricing**: Checks that extracted receipt items, quantities, and prices appear in the results table.
19. **Visible Totals & Taxes**: Confirms subtotal, tax, and grand total match parsed data.
20. **Client-Side JSON Export**: Triggers the `Export JSON` action and asserts a valid `.json` download event.
21. **Client-Side CSV Export**: Triggers the `Export CSV` action and asserts a valid `.csv` download event.
22. **Real-time Quota Meter Increment**: Confirms monthly usage meter increases (e.g. `1 of 20 receipts used`) immediately after parsing.
23. **Security & Negative Failure Testing**:
    - Invalid login credentials display user-friendly error banners.
    - Unsupported file types (`.txt`) are rejected in the UI before network upload.
    - Files exceeding the 10 MB limit are rejected with clear file size alerts.
    - Unauthenticated dashboard access triggers automatic redirection to `/login`.
    - Direct unauthenticated API requests are rejected with `401 MISSING_API_KEY`.
24. **Failure Artifact Retention**: Whenever any test fails, screenshots, videos, and Playwright execution traces are saved for 14 days.

### Gate Status:
- If all 24 checkpoints pass: **`RELEASE READY`**
- If any single requirement or test fails: **`RELEASE BLOCKED`** (deployment halted).
