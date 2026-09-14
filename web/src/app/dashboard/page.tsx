"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReceiptUploadExperience from "@/components/ReceiptUploadExperience";
import UsageChart from "@/components/UsageChart";
import { api, ApiClientError } from "@/lib/api";
import { getSessionKey, clearSessionKey, maskApiKey } from "@/lib/auth";
import {
  UploadCloud,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  LogOut,
  ExternalLink,
  Terminal,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [usage, setUsage] = useState<any | null>(null);
  const [dailyUsage, setDailyUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const key = getSessionKey();
    if (!key) {
      router.push("/login");
      return;
    }
    setApiKey(key);
    loadDashboardData(key);
  }, []);

  const loadDashboardData = async (key: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // 1. Verify user profile
      const verifyRes = await api.verifyKey(key);
      setUser(verifyRes.user);

      // 2. Fetch monthly usage
      const usageRes = await api.getUsage(key);
      setUsage(usageRes);

      // 3. Fetch 30-day activity
      const dailyRes = await api.getDailyUsage(key);
      setDailyUsage(dailyRes.days || []);
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearSessionKey();
        router.push("/login");
      } else {
        setError(err.message || "Failed to load account information.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    clearSessionKey();
    router.push("/login");
  };

  const handleUpgrade = async (plan: "starter" | "pro" | "business") => {
    if (!apiKey) return;
    setBillingLoading(plan);
    setError(null);
    try {
      const res = await api.createCheckout(apiKey, plan);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        setBillingLoading(null);
      }
    } catch (err: any) {
      setError(err.message || "Unable to initiate checkout.");
      setBillingLoading(null);
    }
  };

  const handlePortal = async () => {
    if (!apiKey) return;
    setBillingLoading("portal");
    setError(null);
    try {
      const res = await api.createPortal(apiKey);
      if (res.portal_url) {
        window.location.href = res.portal_url;
      } else {
        setBillingLoading(null);
      }
    } catch (err: any) {
      setError(err.message || "No active Stripe customer found. Please upgrade first.");
      setBillingLoading(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </main>
        <Footer />
      </>
    );
  }

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 20;
  const remaining = usage?.remaining ?? 20;
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const plan = usage?.plan || "free";
  const resetDate = usage?.reset_date || "First of next month";

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* WELCOME BANNER & PLAN STATUS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ready to parse receipts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Signed in as <strong className="text-slate-200">{user?.email}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#upload-box"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Receipt
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* 1. PRIMARY HERO ACTION: UPLOAD RECEIPT SECTION */}
        <section id="upload-box" className="scroll-mt-20">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-bold text-white">Upload a Receipt or Invoice</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Drop an image or PDF below. We automatically extract items, taxes, totals, and let you export JSON or CSV.
            </p>
          </div>

          {/* Self-contained ReceiptUploadExperience with user's live session */}
          <ReceiptUploadExperience
            defaultApiKey={apiKey || ""}
            onSuccess={() => {
              if (apiKey) {
                // Refresh usage metrics in background without full-page loading flash
                loadDashboardData(apiKey, true);
              }
            }}
          />
        </section>

        {/* 2. MONTHLY USAGE & PLAN QUOTA */}
        <section className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Monthly Usage
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Receipts Processed this Month
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {plan} Plan
              </span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                <strong>{used.toLocaleString()}</strong> of <strong>{limit.toLocaleString()}</strong> receipts used
              </span>
              <span className="text-white font-bold font-mono">
                {remaining.toLocaleString()} receipts remaining
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${percentage}%` }}
                className={`h-full transition-all duration-500 ${
                  percentage > 85 ? "bg-amber-500" : "bg-cyan-500"
                }`}
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Current Plan</span>
              <span className="font-bold text-white capitalize text-sm">{plan}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Monthly Limit</span>
              <span className="font-bold text-white text-sm">{limit.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Used this Month</span>
              <span className="font-bold text-cyan-400 text-sm">{used.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Quota Resets On</span>
              <span className="font-bold text-slate-300 font-mono text-xs">{resetDate}</span>
            </div>
          </div>
        </section>

        {/* 3. PLAN UPGRADES / SUBSCRIPTIONS */}
        <section className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Flexible Plans
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Need more monthly receipts?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hard monthly limits ensure no surprise charges. Upgrade or downgrade anytime.
              </p>
            </div>

            {user?.stripe_customer_id && (
              <button
                onClick={handlePortal}
                disabled={Boolean(billingLoading)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                Manage Billing & Invoices
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Starter Plan */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-slate-300">Starter</span>
                  <span className="text-sm font-extrabold text-white">$5<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>250 receipts/month</strong>. Perfect for personal finances, freelancers, and small contractors.
                </p>
              </div>
              <button
                onClick={() => handleUpgrade("starter")}
                disabled={Boolean(billingLoading) || plan === "starter"}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  plan === "starter"
                    ? "bg-slate-800 text-slate-400 cursor-default"
                    : "border border-slate-700 hover:bg-slate-800 text-slate-200"
                }`}
              >
                {billingLoading === "starter" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : plan === "starter" ? (
                  "Current Plan"
                ) : (
                  "Upgrade to Starter ($5/mo)"
                )}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-5 rounded-xl border-2 border-cyan-500/60 bg-[#0d1424] flex flex-col justify-between space-y-4 relative shadow-lg shadow-cyan-500/10">
              <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-cyan-500 text-slate-950 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Popular
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-cyan-400">Pro</span>
                  <span className="text-sm font-extrabold text-white">$15<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  <strong>1,000 receipts/month</strong>. For accounting firms, small businesses, and volume expense tracking.
                </p>
              </div>
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={Boolean(billingLoading) || plan === "pro"}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 ${
                  plan === "pro"
                    ? "bg-slate-800 text-slate-400 cursor-default"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                }`}
              >
                {billingLoading === "pro" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : plan === "pro" ? (
                  "Current Plan"
                ) : (
                  "Upgrade to Pro ($15/mo)"
                )}
              </button>
            </div>

            {/* Business Plan */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-slate-300">Business</span>
                  <span className="text-sm font-extrabold text-white">$39<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>5,000 receipts/month</strong>. High-volume business expense processing with higher rate limits.
                </p>
              </div>
              <button
                onClick={() => handleUpgrade("business")}
                disabled={Boolean(billingLoading) || plan === "business"}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  plan === "business"
                    ? "bg-slate-800 text-slate-400 cursor-default"
                    : "border border-slate-700 hover:bg-slate-800 text-slate-200"
                }`}
              >
                {billingLoading === "business" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : plan === "business" ? (
                  "Current Plan"
                ) : (
                  "Upgrade to Business ($39/mo)"
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 4. OPTIONAL / ADVANCED DEVELOPER SETTINGS (COLLAPSIBLE) */}
        <section className="rounded-2xl border border-slate-800/80 bg-[#0a0f19] p-5 space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-left text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Developer Settings & API Key
            </span>
            <span className="text-[11px] text-cyan-400">
              {showAdvanced ? "Hide settings" : "Click to view API key & technical docs"}
            </span>
          </button>

          {showAdvanced && (
            <div className="pt-4 border-t border-slate-800 space-y-6">
              {/* API Key Box */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Account API Key
                </label>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between">
                  <span>{apiKey ? maskApiKey(apiKey) : "••••••••••••"}</span>
                  <button
                    onClick={handleCopyKey}
                    className="ml-2 p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                    title="Copy API key"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Use this key to integrate receipt parsing directly into your own applications.
                </p>
              </div>

              {/* 30-Day Activity Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300">
                    30-Day Request Volume
                  </h3>
                  <Link href="/docs" className="text-xs text-cyan-400 hover:underline">
                    View API documentation &rarr;
                  </Link>
                </div>
                <UsageChart days={dailyUsage} />
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
