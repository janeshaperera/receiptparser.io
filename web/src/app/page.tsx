import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CodeTabs from "@/components/CodeTabs";
import JsonViewer from "@/components/JsonViewer";
import TryItWidget from "@/components/TryItWidget";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Calculator,
  Calendar,
  FileCheck,
  CheckCircle,
  Terminal,
  Clock
} from "lucide-react";

export default function LandingPage() {
  const sampleData = {
    vendor_name: "Blue Bottle Coffee",
    raw_date: "09/12/2026",
    date: "2026-09-12",
    currency: "USD",
    line_items: [
      {
        description: "Hayes Valley Espresso",
        quantity: 1,
        unit_price: 4.75,
        total_price: 4.75
      },
      {
        description: "Almond Croissant",
        quantity: 2,
        unit_price: 5.25,
        total_price: 10.5
      }
    ],
    subtotal: 15.25,
    tax: 1.35,
    total: 16.6
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.18),rgba(255,255,255,0))]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                Powered by Gemini Vision Structured Output
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                Turn receipts into{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  structured JSON.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Upload a receipt or invoice image or PDF. Get clean, balanced, structured financial data through one reliable REST API.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Get your API key
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/docs"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  View documentation
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 50 free requests
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Self-service setup
                </span>
              </div>
            </div>

            {/* HERO CODE & JSON PREVIEWS */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-6xl mx-auto">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 mb-2 font-semibold">
                  API Request
                </div>
                <CodeTabs />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 mb-2 font-semibold">
                  Structured Response
                </div>
                <JsonViewer data={sampleData} title="Normalized Receipt Payload" />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 border-y border-slate-800/80 bg-[#060910]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Simple Integration
              </h2>
              <p className="text-3xl font-bold tracking-tight text-white">
                Engineered for SaaS & Expense Apps
              </p>
              <p className="text-slate-400 text-sm">
                Built from the ground up for developers who need reliable financial document ingestion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] space-y-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Multi-Format Support</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Accept JPEG, PNG, WEBP, and PDF files up to 10 MB. Verified with file header magic byte inspection.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] space-y-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Arithmetic Self-Consistency</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every receipt verifies that line item sums equal the subtotal and taxes balance. Automatically triggers recalculation if numbers mismatch.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] space-y-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Smart Date Normalization</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Preserves raw printed receipt dates while resolving clean ISO 8601 (YYYY-MM-DD) based on regional currency and address evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRY IT PLAYGROUND */}
        <section id="try-it" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <h2 className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Live Playground
              </h2>
              <p className="text-3xl font-bold tracking-tight text-white">
                Test with your receipts
              </p>
              <p className="text-slate-400 text-sm">
                Paste your API key and inspect the structured output directly in your browser.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <TryItWidget />
            </div>
          </div>
        </section>

        {/* PRICING TABLE */}
        <section id="pricing" className="py-24 border-t border-slate-800/80 bg-[#060910]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Predictable Pricing
              </h2>
              <p className="text-3xl font-bold tracking-tight text-white">
                Start free, upgrade as you scale
              </p>
              <p className="text-slate-400 text-sm">
                Self-service billing powered by Stripe. Upgrade or cancel anytime from your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* FREE */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-semibold text-slate-400">
                    Free
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Perfect for hobbyists, prototyping, and small personal projects.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>50 requests</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Gemini Vision OCR extraction</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>No credit card required</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-2.5 text-center rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
                >
                  Start Free
                </Link>
              </div>

              {/* STARTER (FEATURED) */}
              <div className="rounded-2xl border-2 border-cyan-500/60 bg-[#0d1424] p-8 flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-slate-950 rounded-full text-xs font-bold tracking-wide uppercase">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-semibold text-cyan-400">
                    Starter
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$29</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    For production apps, automated bookkeeping, and growing SaaS.
                  </p>
                  <div className="pt-4 border-t border-slate-800 space-y-3 text-sm text-slate-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>1,000 requests</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Self-consistency recalculation</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Stripe Customer Portal access</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-2.5 text-center rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20"
                >
                  Get Started
                </Link>
              </div>

              {/* PRO */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-semibold text-slate-400">
                    Pro
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$99</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    For high-volume expense platforms and enterprise workflows.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>10,000 requests</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>High rate limits (100 req/window)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Priority throughput</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-2.5 text-center rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
