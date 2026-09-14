import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReceiptUploadExperience from "@/components/ReceiptUploadExperience";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Calculator,
  Calendar,
  FileCheck,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.18),rgba(255,255,255,0))] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Next-Generation Receipt AI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Turn receipts into{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  structured data.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Upload a receipt or invoice and get clean, organized data in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-xl shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Try it free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400 pt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 20 free receipts/mo
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Instant results
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card needed
                </span>
              </div>

              {/* Simple visual flow */}
              <div className="pt-8 pb-2">
                <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 font-medium">
                    <span>📄</span>
                    <span>Receipt Image</span>
                  </div>
                  <div className="text-cyan-400 sm:rotate-[-90deg] font-bold">
                    ↓
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Processing</span>
                  </div>
                  <div className="text-cyan-400 sm:rotate-[-90deg] font-bold">
                    ↓
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                    <span>✓</span>
                    <span>Organized Information</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MAIN UPLOAD AREA */}
            <div id="upload-receipt" className="mt-8 sm:mt-12 scroll-mt-24">
              <ReceiptUploadExperience />
            </div>
          </div>
        </section>

        {/* 8. TWO CLEAR PATHS */}
        <section className="py-16 border-t border-slate-800/80 bg-[#070b14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                How would you like to use ReceiptParser.io?
              </h2>
              <p className="text-sm text-slate-400">
                Choose the solution that best fits your workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#090d16] hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-6 shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl">
                    🧾
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Just parse a receipt
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Upload a receipt and get organized information.
                    </p>
                  </div>
                </div>
                <div>
                  <Link
                    href="/try"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20"
                  >
                    Try It
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#090d16] hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
                    💻
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Build with our API
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Integrate receipt parsing into your own application.
                    </p>
                  </div>
                </div>
                <div>
                  <Link
                    href="/docs"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all"
                  >
                    View API Docs
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section id="how-it-works" className="py-20 border-y border-slate-800/80 bg-[#060910]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Simple 3-Step Process
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                How ReceiptParser.io Works
              </h2>
              <p className="text-slate-400 text-sm">
                Fast, automated extraction with zero manual data entry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-[#090d16] space-y-4 hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">Upload Receipt</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Drop in any paper receipt, invoice scan, JPG, PNG, or PDF up to 10 MB from your phone or computer.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-[#090d16] space-y-4 hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">AI Vision Analysis</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Gemini Vision reads the image, identifies line items, checks arithmetic consistency, and balances totals.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-[#090d16] space-y-4 hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Review & Export</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  See clean merchant info, dates, and amounts. Copy, edit, or download the results instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PRICING TABLE */}
        <section id="pricing" className="py-24 bg-[#080c14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Transparent Pricing
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Simple Plans for Everyone
              </h2>
              <p className="text-slate-400 text-sm">
                Hard monthly limits. No surprise AI usage charges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* FREE */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-slate-400">
                    Free
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$0</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 min-h-[36px]">
                    Occasional receipt scans and personal expense tracking.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>20 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Basic receipt parsing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>JSON export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>No credit card needed</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-6 w-full py-2.5 text-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all"
                >
                  Start Free
                </Link>
              </div>

              {/* STARTER */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-slate-300">
                    Starter
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$5</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 min-h-[36px]">
                    Ideal for freelancers, contractors, and individuals.
                  </p>
                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>250 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Receipt history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>CSV & JSON export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Stripe self-service portal</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-6 w-full py-2.5 text-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all"
                >
                  Get Starter
                </Link>
              </div>

              {/* PRO */}
              <div className="rounded-2xl border-2 border-cyan-500/60 bg-[#0d1424] p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-cyan-500 text-slate-950 rounded-full text-[10px] font-bold tracking-wide uppercase">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-cyan-400">
                    Pro
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$15</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-300 min-h-[36px]">
                    For professionals, small teams, and power users.
                  </p>
                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>1,000 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Full API access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Usage dashboard & telemetry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>CSV & JSON export</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-6 w-full py-2.5 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
                >
                  Get Pro
                </Link>
              </div>

              {/* BUSINESS */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-slate-300">
                    Business
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$39</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 min-h-[36px]">
                    For growing businesses, bookkeeping, and higher volumes.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>5,000 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Full API access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Higher rate limits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-6 w-full py-2.5 text-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all"
                >
                  Get Business
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
