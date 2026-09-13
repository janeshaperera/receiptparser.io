"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api, ApiClientError } from "../lib/api";
import JsonViewer from "./JsonViewer";

export default function TryItWidget() {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!allowedTypes.includes(selected.type)) {
      setError("Invalid file type. Supported formats: JPEG, PNG, WEBP, PDF.");
      setFile(null);
      return;
    }

    if (selected.size > maxSizeBytes) {
      setError("File exceeds 10 MB limit. Please upload a smaller file.");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a receipt image or PDF.");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please provide an API key. You can get a free key in 5 seconds without a credit card.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.parseReceipt(apiKey.trim(), file);
      setResult(data);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(`[${err.code}] ${err.message}`);
      } else {
        setError(err.message || "Failed to parse receipt. Please verify your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Input form */}
        <form onSubmit={handleParse} className="flex-1 space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Step 1: Your API Key
            </label>
            <input
              type="text"
              placeholder="rcpt_live_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Don&apos;t have a key?{" "}
              <a href="/signup" className="text-cyan-400 hover:underline">
                Get 50 free requests &rarr;
              </a>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Step 2: Upload Receipt or Invoice
            </label>
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/50">
              <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
              <span className="text-sm font-medium text-slate-300">
                {file ? file.name : "Drop receipt here or click to browse"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPEG, PNG, WEBP, or PDF (up to 10 MB)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to parse ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing with Gemini Vision...
              </>
            ) : (
              "Extract Structured JSON"
            )}
          </button>
        </form>

        {/* Output pane */}
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Resulting Data
          </label>
          {result ? (
            <JsonViewer data={result} title="Live Extraction Result" />
          ) : (
            <div className="h-[320px] rounded-xl border border-slate-800 bg-[#090d16] flex flex-col items-center justify-center text-slate-600 p-6 text-center">
              <FileText className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No extraction data yet</p>
              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Enter your API key and upload a receipt to test structured OCR extraction in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
