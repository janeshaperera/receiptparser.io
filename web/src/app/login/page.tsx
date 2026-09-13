"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, ApiClientError } from "@/lib/api";
import { setSessionKey } from "@/lib/auth";
import { Key, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Please enter your API key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate key via the backend
      const res = await api.verifyKey(apiKey.trim());
      if (res.valid) {
        setSessionKey(apiKey.trim());
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Invalid API key. Please check your credentials.");
      } else {
        setError("Unable to connect to the authentication service.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Sign in with your API Key</h1>
            <p className="text-sm text-slate-400">
              ReceiptParser.io uses passwordless API key authentication.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Live API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="rcpt_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
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
                    Validating...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <Link href="/recover" className="hover:text-cyan-400 transition-colors">
                Lost your key?
              </Link>
              <Link href="/signup" className="text-cyan-400 hover:underline">
                Create new account &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
