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
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
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
                Upload a receipt and ReceiptParser.io automatically extracts the important information.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href="#upload-receipt"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-xl shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Upload a Receipt
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400 pt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 50 free receipts
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Instant results
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card needed
                </span>
              </div>
            </div>

            {/* 2. MAIN UPLOAD AREA */}
            <div id="upload-receipt" className="mt-12 sm:mt-16 scroll-mt-24">
              <ReceiptUploadExperience />
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
                Start with 50 free receipts, upgrade whenever you need more volume.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* FREE */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-slate-400">
                    Free
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Great for occasional receipt scans and personal expenses.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>50 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Instant OCR extraction</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>No credit card required</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-3 text-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
                >
                  Start Free
                </Link>
              </div>

              {/* STARTER */}
              <div className="rounded-2xl border-2 border-cyan-500/60 bg-[#0d1424] p-8 flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-slate-950 rounded-full text-xs font-bold tracking-wide uppercase">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-cyan-400">
                    Starter
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$29</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    Ideal for small businesses, freelancers, and bookkeepers.
                  </p>
                  <div className="pt-4 border-t border-slate-800 space-y-3 text-sm text-slate-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>1,000 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Math consistency verification</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Self-service billing & portal</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-3 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20"
                >
                  Get Started
                </Link>
              </div>

              {/* PRO */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase font-bold text-slate-400">
                    Pro
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$99</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    For accounting firms and high-volume business expense operations.
                  </p>
                  <div className="pt-4 border-t border-slate-800/80 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span><strong>10,000 receipts</strong> / month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Priority throughput</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>High rate limits</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 w-full py-3 text-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
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
