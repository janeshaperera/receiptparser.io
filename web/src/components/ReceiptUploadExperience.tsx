"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X, Sparkles, Key } from "lucide-react";
import { api, ApiClientError } from "../lib/api";
import { getOrCreateDemoSessionKey } from "../lib/auth";
import ReceiptResultsView, { ParsedReceiptData } from "./ReceiptResultsView";

interface ReceiptUploadExperienceProps {
  defaultApiKey?: string;
  onSuccess?: (data: ParsedReceiptData) => void;
}

export default function ReceiptUploadExperience({ defaultApiKey = "" }: ReceiptUploadExperienceProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState<ParsedReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  const validateAndSetFile = (selected: File) => {
    setError(null);
    setErrorDetails(null);

    if (!allowedTypes.includes(selected.type)) {
      setError("We can't read this file type. Please upload a JPG, PNG, WEBP, or PDF.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (selected.size > maxSizeBytes) {
      setError("File exceeds 10 MB limit. Please upload a smaller receipt.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(selected);

    // If it's an image, create a preview
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const clearSelectedFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAndParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drop a receipt file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setProcessingStep(0);

    // Animate user-friendly progression steps:
    // Step 0: ✓ Receipt uploaded
    // Step 1: ✓ Reading receipt
    // Step 2: ● Extracting information
    // Step 3: ○ Checking results
    const step1 = setTimeout(() => setProcessingStep(1), 500);
    const step2 = setTimeout(() => setProcessingStep(2), 1200);
    const step3 = setTimeout(() => setProcessingStep(3), 2000);

    try {
      let keyToUse = apiKey.trim();
      if (!keyToUse) {
        keyToUse = await getOrCreateDemoSessionKey();
      }

      if (!keyToUse) {
        setError("An API key is required to process receipts. Please create a key or enter yours below.");
        setShowKeyInput(true);
        setLoading(false);
        return;
      }

      const data = await api.parseReceipt(keyToUse, file);
      setResult(data);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);

      if (err instanceof ApiClientError) {
        if (err.code === "MISSING_API_KEY" || err.code === "INVALID_API_KEY") {
          setError("Your session or API key is invalid. Please get a new free key.");
          setShowKeyInput(true);
        } else if (err.code === "PLAN_LIMIT_EXCEEDED") {
          const resetNotice = err.details?.reset_date ? ` Quota resets on ${err.details.reset_date}.` : "";
          setError(`You've reached your monthly receipt limit.${resetNotice} Please upgrade your plan for higher monthly limits.`);
        } else if (err.code === "INVALID_FILE_TYPE") {
          setError("We can't read this file type. Please upload a JPG, PNG, WEBP, or PDF.");
        } else if (err.code === "FILE_TOO_LARGE") {
          setError("File exceeds 10 MB limit. Please upload a smaller receipt.");
        } else {
          setError("Something went wrong while processing your receipt.");
        }
        setErrorDetails(`[${err.code}] ${err.message}`);
      } else {
        setError("Something went wrong while processing your receipt. Please check your connection.");
        setErrorDetails(err.message || String(err));
      }
    } finally {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    clearSelectedFile();
    setError(null);
    setErrorDetails(null);
  };

  // If parsed successfully, render the modern human-friendly results view
  if (result) {
    return <ReceiptResultsView data={result} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Upload Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        {!loading ? (
          <form onSubmit={handleUploadAndParse} className="space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                  : "border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                data-testid="file-input"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!file ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10 text-2xl">
                    📄
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Drop your receipt here
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">
                    or
                  </p>

                  <div className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20 pointer-events-none">
                    Choose a file
                  </div>

                  <p className="text-xs text-slate-400 mt-5">
                    JPG, PNG, WEBP or PDF • Maximum 10 MB
                  </p>
                </>
              ) : (
                /* Selected File Preview */
                <div
                  className="w-full flex flex-col items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {previewUrl ? (
                    <div className="relative mb-4 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="max-h-48 rounded-xl object-contain border border-slate-700 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-600 shadow-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 text-xl">
                      📄
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>{file.name}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Ready to parse
                    </span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Choose a different file
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional API Key Accordion (default hidden for consumer ease) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showKeyInput ? "Hide API key settings" : "Have your own API key? Click to add"}</span>
              </button>

              {showKeyInput && (
                <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="rcpt_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Don&apos;t have one?{" "}
                    <a href="/signup" className="text-cyan-400 hover:underline">
                      Get 20 free receipts every month &rarr;
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* User-friendly Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                  <div className="font-medium">{error}</div>
                </div>

                {errorDetails && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTechDetails(!showTechDetails)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                    >
                      {showTechDetails ? "Hide technical details" : "Technical details"}
                    </button>
                    {showTechDetails && (
                      <pre className="mt-2 p-2.5 rounded bg-black/40 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {errorDetails}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={!file}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Turn Receipt Into Structured Data</span>
            </button>
          </form>
        ) : (
          /* Processing State Animation */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Analyzing your receipt...</h3>
              <p className="text-xs text-slate-400">
                Extracting merchant, line items, taxes, and totals
              </p>
            </div>

            {/* Processing Checklist Steps */}
            <div className="w-full max-w-xs space-y-2.5 text-left text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-medium">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span className="text-slate-200">Receipt uploaded</span>
              </div>
              <div className="flex items-center gap-3">
                {processingStep >= 1 ? (
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                ) : (
                  <span className="text-cyan-400 font-bold text-sm">●</span>
                )}
                <span className={processingStep >= 1 ? "text-slate-200" : "text-cyan-300 font-semibold"}>
                  Reading receipt
                </span>
              </div>
              <div className="flex items-center gap-3">
                {processingStep >= 2 ? (
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                ) : processingStep === 1 ? (
                  <span className="text-cyan-400 font-bold text-sm">●</span>
                ) : (
                  <span className="text-slate-500 font-bold text-sm">○</span>
                )}
                <span className={processingStep >= 2 ? "text-slate-200" : processingStep === 1 ? "text-cyan-300 font-semibold" : "text-slate-500"}>
                  Extracting information
                </span>
              </div>
              <div className="flex items-center gap-3">
                {processingStep >= 3 ? (
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                ) : processingStep === 2 ? (
                  <span className="text-cyan-400 font-bold text-sm">●</span>
                ) : (
                  <span className="text-slate-500 font-bold text-sm">○</span>
                )}
                <span className={processingStep >= 3 ? "text-slate-200" : processingStep === 2 ? "text-cyan-300 font-semibold" : "text-slate-500"}>
                  Checking results
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
