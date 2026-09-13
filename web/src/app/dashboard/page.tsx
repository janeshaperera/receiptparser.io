"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UsageChart from "@/components/UsageChart";
import { api, ApiClientError } from "@/lib/api";
import { getSessionKey, clearSessionKey, maskApiKey } from "@/lib/auth";
import {
  Key,
  Copy,
  Check,
  Zap,
  TrendingUp,
  CreditCard,
  LogOut,
  ExternalLink,
  Terminal,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [usage, setUsage] = useState<any | null>(null);
  const [dailyUsage, setDailyUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = getSessionKey();
    if (!key) {
      router.push("/login");
      return;
    }
    setApiKey(key);
    loadDashboardData(key);
  }, []);

  const loadDashboardData = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify key
      const verifyRes = await api.verifyKey(key);
      setUser(verifyRes.user);

      // 2. Fetch monthly usage
      const usageRes = await api.getUsage(key);
      setUsage(usageRes);

      // 3. Fetch 30-day daily usage breakdown
      const dailyRes = await api.getDailyUsage(key);
      setDailyUsage(dailyRes.days || []);
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearSessionKey();
        router.push("/login");
      } else {
        setError(err.message || "Failed to load dashboard telemetry.");
      }
    } finally {
      setLoading(false);
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

  const handleUpgrade = async (plan: "starter" | "pro") => {
    if (!apiKey) return;
    setBillingLoading(true);
    setError(null);
    try {
      const res = await api.createCheckout(apiKey, plan);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err: any) {
      setError(err.message || "Unable to initiate Stripe checkout.");
      setBillingLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!apiKey) return;
    setBillingLoading(true);
    setError(null);
    try {
      const res = await api.createPortal(apiKey);
      if (res.portal_url) {
        window.location.href = res.portal_url;
      }
    } catch (err: any) {
      setError(err.message || "No active Stripe customer found. Please upgrade first.");
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm font-mono">Loading developer dashboard...</p>
        </main>
        <Footer />
      </>
    );
  }

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 50;
  const remaining = usage?.remaining ?? 50;
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const plan = usage?.plan || "free";

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Developer Dashboard
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {plan} plan
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Account: <span className="font-mono text-slate-300">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              API Docs
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
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

        {/* METRICS & API KEY ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* API Key Box */}
          <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" />
                Live API Key
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Masked</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between">
              <span>{apiKey ? maskApiKey(apiKey) : "••••••••••••"}</span>
              <button
                onClick={handleCopyKey}
                className="ml-2 p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                title="Copy API key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Authenticate all requests with header: <br />
              <code className="text-slate-400 font-mono text-[11px]">Authorization: Bearer rcpt_live_...</code>
            </p>
          </div>

          {/* Quota Progress */}
          <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Monthly Quota ({usage?.period || "Current Period"})
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {used.toLocaleString()} / {limit.toLocaleString()} reqs ({percentage}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${percentage}%` }}
                  className={`h-full transition-all duration-500 ${
                    percentage > 85 ? "bg-amber-500" : "bg-cyan-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Plan Tier</span>
                <span className="font-semibold text-slate-200 capitalize">{plan}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monthly Limit</span>
                <span className="font-semibold text-slate-200">{limit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Used this Month</span>
                <span className="font-semibold text-cyan-400">{used.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Remaining</span>
                <span className="font-semibold text-emerald-400">{remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 30-DAY CHART SECTION */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              30-Day Daily Request Volume
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Telemetry</span>
          </div>
          <UsageChart days={dailyUsage} />
        </div>

        {/* BILLING ACTIONS */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Subscription & Billing Management
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage your payment methods, change tiers, or cancel your subscription via Stripe Customer Portal.
              </p>
            </div>

            {user?.stripe_customer_id && (
              <button
                onClick={handlePortal}
                disabled={billingLoading}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                Manage Billing on Stripe
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upgrade Cards if on Free or Starter */}
          {plan !== "pro" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              {plan === "free" && (
                <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Starter Plan</span>
                    <p className="text-xs text-slate-300 mt-0.5">1,000 reqs/mo for $29/mo</p>
                  </div>
                  <button
                    onClick={() => handleUpgrade("starter")}
                    disabled={billingLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-all"
                  >
                    Upgrade
                  </button>
                </div>
              )}

              <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase">Pro Plan</span>
                  <p className="text-xs text-slate-400 mt-0.5">10,000 reqs/mo for $99/mo</p>
                </div>
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={billingLoading}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
