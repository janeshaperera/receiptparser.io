"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, ApiClientError } from "@/lib/api";
import { setSessionKey } from "@/lib/auth";
import { Mail, Check, Copy, AlertTriangle, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide a valid work or personal email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.signup(email.trim());
      setCreatedKey(res.api_key.raw_key);
      setSessionKey(res.api_key.raw_key);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to create account.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {createdKey ? "Save your API Key" : "Get your free API Key"}
            </h1>
            <p className="text-sm text-slate-400">
              {createdKey
                ? "Your account has been created. Save your secret key now."
                : "No passwords. Instant self-service setup with 50 free monthly requests."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-8 shadow-2xl">
            {createdKey ? (
              <div className="space-y-6">
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">This key will not be shown again.</span>
                    Copy and store it in your password manager or `.env` file now.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Your New Secret Key
                  </label>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-cyan-300 break-all select-all">
                    {createdKey}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCopy}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Secret Key</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/dashboard"
                    className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Work or Personal Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Generate API Key
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
                  Already have a key?{" "}
                  <Link href="/login" className="text-cyan-400 hover:underline">
                    Sign in here &rarr;
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
