import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CodeTabs from "@/components/CodeTabs";
import { Terminal, Shield, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block space-y-6 text-sm">
            <div>
              <h3 className="font-mono text-xs uppercase font-bold text-cyan-400 tracking-wider mb-3">
                Getting Started
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#quickstart" className="hover:text-white transition-colors">Quickstart</a></li>
                <li><a href="#authentication" className="hover:text-white transition-colors">Authentication</a></li>
                <li><a href="#supported-files" className="hover:text-white transition-colors">Supported Formats & Limits</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase font-bold text-cyan-400 tracking-wider mb-3">
                API Reference
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#parse-endpoint" className="hover:text-white transition-colors">POST /v1/parse</a></li>
                <li><a href="#usage-endpoint" className="hover:text-white transition-colors">GET /v1/usage</a></li>
                <li><a href="#daily-endpoint" className="hover:text-white transition-colors">GET /v1/usage/daily</a></li>
                <li><a href="#checkout-endpoint" className="hover:text-white transition-colors">POST /v1/billing/checkout</a></li>
                <li><a href="#portal-endpoint" className="hover:text-white transition-colors">POST /v1/billing/portal</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase font-bold text-cyan-400 tracking-wider mb-3">
                Architecture & Rules
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#date-handling" className="hover:text-white transition-colors">Date Normalization</a></li>
                <li><a href="#consistency" className="hover:text-white transition-colors">Self-Consistency Verification</a></li>
                <li><a href="#errors" className="hover:text-white transition-colors">Error Codes & Responses</a></li>
                <li><a href="#rate-limits" className="hover:text-white transition-colors">Rate Limits & Quotas</a></li>
              </ul>
            </div>
          </aside>

          {/* MAIN DOCUMENTATION CONTENT */}
          <div className="lg:col-span-3 space-y-12">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                ReceiptParser.io API Documentation
              </h1>
              <p className="text-base text-slate-300 leading-relaxed">
                ReceiptParser.io provides a fast, production-ready REST API for turning receipt and invoice images or PDFs into structured financial JSON using Google Gemini Vision structured outputs.
              </p>
            </div>

            {/* QUICKSTART */}
            <section id="quickstart" className="space-y-4 pt-6 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Quickstart
              </h2>
              <p className="text-sm text-slate-400">
                Generate an API key in 5 seconds from the signup page, then execute a multipart POST request with your file:
              </p>
              <CodeTabs />
            </section>

            {/* AUTHENTICATION */}
            <section id="authentication" className="space-y-4 pt-6 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Authentication
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                All requests to protected endpoints require an API key passed in the standard HTTP <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header:
              </p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-400">
                Authorization: Bearer rcpt_live_xxxxxxxxxxxxxxxxxxxxxxxx
              </div>
              <p className="text-xs text-slate-400">
                API keys are cryptographically random, prefixed with <code className="text-slate-300 font-mono">rcpt_live_</code>, and stored on our servers using salted bcrypt hashes.
              </p>
            </section>

            {/* SUPPORTED FORMATS & LIMITS */}
            <section id="supported-files" className="space-y-4 pt-6 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Supported Formats & Size Limits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
                  <h4 className="font-semibold text-white">Allowed File Formats</h4>
                  <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                    <li>JPEG / JPG (<code className="font-mono text-cyan-300">image/jpeg</code>)</li>
                    <li>PNG (<code className="font-mono text-cyan-300">image/png</code>)</li>
                    <li>WEBP (<code className="font-mono text-cyan-300">image/webp</code>)</li>
                    <li>PDF Documents (<code className="font-mono text-cyan-300">application/pdf</code>)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
                  <h4 className="font-semibold text-white">File Size Limitation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Maximum file size is <strong>10 MB</strong>. All uploads are validated via file header magic bytes in addition to MIME type and extension to prevent spoofing.
                  </p>
                </div>
              </div>
            </section>

            {/* ENDPOINT: POST /v1/parse */}
            <section id="parse-endpoint" className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  POST
                </span>
                <h2 className="text-xl font-bold text-white font-mono">/v1/parse</h2>
              </div>
              <p className="text-sm text-slate-300">
                Primary receipt parsing endpoint. Accepts a multipart/form-data payload with a <code className="font-mono text-cyan-300">file</code> field.
              </p>

              <h3 className="text-sm font-semibold text-white mt-4">Response Object:</h3>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`{
  "vendor_name": "Blue Bottle Coffee",
  "raw_date": "09/12/2026",
  "date": "2026-09-12",
  "currency": "USD",
  "line_items": [
    {
      "description": "Hayes Valley Espresso",
      "quantity": 1,
      "unit_price": 4.75,
      "total_price": 4.75
    }
  ],
  "subtotal": 4.75,
  "tax": 0.42,
  "total": 5.17
}`}
              </pre>
            </section>

            {/* ERROR FORMAT */}
            <section id="errors" className="space-y-4 pt-6 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Standardized Error Format
              </h2>
              <p className="text-sm text-slate-300">
                All API error responses follow a standardized envelope:
              </p>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-rose-300 overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "Monthly request limit exceeded for your plan.",
    "details": {
      "plan": "free",
      "used": 50,
      "limit": 50
    }
  }
}`}
              </pre>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 font-mono uppercase">
                    <tr>
                      <th className="p-3 border-b border-slate-800">Error Code</th>
                      <th className="p-3 border-b border-slate-800">HTTP Status</th>
                      <th className="p-3 border-b border-slate-800">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    <tr><td className="p-3 text-cyan-300">MISSING_API_KEY</td><td className="p-3">401</td><td className="p-3 font-sans">No Authorization header supplied</td></tr>
                    <tr><td className="p-3 text-cyan-300">INVALID_API_KEY</td><td className="p-3">401</td><td className="p-3 font-sans">Key does not exist or has been revoked</td></tr>
                    <tr><td className="p-3 text-cyan-300">INVALID_FILE_TYPE</td><td className="p-3">400</td><td className="p-3 font-sans">File is not JPEG, PNG, WEBP, or PDF</td></tr>
                    <tr><td className="p-3 text-cyan-300">FILE_TOO_LARGE</td><td className="p-3">400</td><td className="p-3 font-sans">File exceeds 10 MB limit</td></tr>
                    <tr><td className="p-3 text-cyan-300">PLAN_LIMIT_EXCEEDED</td><td className="p-3">429</td><td className="p-3 font-sans">Monthly quota reached for plan tier</td></tr>
                    <tr><td className="p-3 text-cyan-300">RATE_LIMIT_EXCEEDED</td><td className="p-3">429</td><td className="p-3 font-sans">Too many requests in a short window</td></tr>
                    <tr><td className="p-3 text-cyan-300">CONSISTENCY_CHECK_FAILED</td><td className="p-3">422</td><td className="p-3 font-sans">Receipt math did not balance after recalculation</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
