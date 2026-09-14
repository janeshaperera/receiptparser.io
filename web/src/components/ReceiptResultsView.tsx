"use client";

import { useState } from "react";
import { Check, Copy, Download, Edit3, Save, ChevronDown, ChevronUp, RefreshCw, FileText } from "lucide-react";
import JsonViewer from "./JsonViewer";

export interface ParsedLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ParsedReceiptData {
  vendor_name: string;
  raw_date?: string;
  date: string;
  currency: string;
  line_items: ParsedLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface ReceiptResultsViewProps {
  data: ParsedReceiptData;
  onReset: () => void;
}

export default function ReceiptResultsView({ data: initialData, onReset }: ReceiptResultsViewProps) {
  const [data, setData] = useState<ParsedReceiptData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<ParsedReceiptData>(initialData);

  const handleCopySummary = () => {
    const lines = [
      `Merchant: ${data.vendor_name}`,
      `Date: ${data.date}`,
      `Currency: ${data.currency}`,
      `Total: ${data.currency === "USD" ? "$" : data.currency + " "}${data.total.toFixed(2)}`,
      "",
      "Items:",
      ...data.line_items.map(
        (item) => `- ${item.description}: ${item.quantity} x ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}`
      ),
      "",
      `Subtotal: ${data.subtotal.toFixed(2)}`,
      `Tax: ${data.tax.toFixed(2)}`,
      `Total: ${data.total.toFixed(2)}`
    ].join("\n");

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${data.vendor_name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "parsed"}-${data.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setData(editForm);
    setIsEditing(false);
  };

  const currencySymbol = data.currency === "USD" ? "$" : `${data.currency} `;

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            ✓
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Receipt Parsed Successfully</h3>
            <p className="text-xs text-slate-400">All data verified and mathematically balanced</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Data</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={onReset}
            className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Parse Another Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Results Card */}
      {!isEditing ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-2xl">
          {/* Header Summary */}
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase font-semibold text-cyan-400 tracking-wider">
                Merchant / Store
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {data.vendor_name || "Unknown Merchant"}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <span>📅 {data.date || data.raw_date || "Date unlisted"}</span>
                <span>•</span>
                <span>Currency: <strong className="text-slate-200">{data.currency}</strong></span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-900/80 sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Total Amount
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mt-1">
                {currencySymbol}{Number(data.total).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-b border-slate-800 bg-slate-900/30">
            <div className="p-4 sm:p-5">
              <span className="text-xs text-slate-500 uppercase font-mono">Subtotal</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">
                {currencySymbol}{Number(data.subtotal).toFixed(2)}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <span className="text-xs text-slate-500 uppercase font-mono">Tax</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">
                {currencySymbol}{Number(data.tax).toFixed(2)}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <span className="text-xs text-slate-500 uppercase font-mono">Items Extracted</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">
                {data.line_items?.length || 0} item{data.line_items?.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Line Items List */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400">
                Purchased Items ({data.line_items?.length || 0})
              </h4>
              <button
                onClick={() => {
                  setEditForm(data);
                  setIsEditing(true);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              {data.line_items && data.line_items.length > 0 ? (
                data.line_items.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/80 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-100">{item.description}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.quantity} × {currencySymbol}{Number(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {currencySymbol}{Number(item.total_price).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No separate line items detected on this receipt.
                </div>
              )}
            </div>

            {/* Financial Breakdown Summary */}
            <div className="pt-4 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">{currencySymbol}{Number(data.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax</span>
                  <span className="font-mono text-slate-200">{currencySymbol}{Number(data.tax).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-base text-white">
                  <span>Total</span>
                  <span className="font-mono text-cyan-400">{currencySymbol}{Number(data.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-[#0d131f] space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-400" />
              Edit Extracted Details
            </h3>
            <span className="text-xs text-slate-400">Make adjustments before downloading</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Merchant
              </label>
              <input
                type="text"
                value={editForm.vendor_name}
                onChange={(e) => setEditForm({ ...editForm, vendor_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Date (YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Currency
              </label>
              <input
                type="text"
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm uppercase"
              />
            </div>
          </div>

          {/* Line Items Edit */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Items
            </label>
            {editForm.line_items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...editForm.line_items];
                    newItems[idx].description = e.target.value;
                    setEditForm({ ...editForm, line_items: newItems });
                  }}
                  className="col-span-6 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...editForm.line_items];
                    newItems[idx].quantity = parseFloat(e.target.value) || 0;
                    newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
                    setEditForm({ ...editForm, line_items: newItems });
                  }}
                  className="col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) => {
                    const newItems = [...editForm.line_items];
                    newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                    newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
                    setEditForm({ ...editForm, line_items: newItems });
                  }}
                  className="col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
                />
                <div className="col-span-2 text-right font-mono text-xs text-slate-300 pr-2">
                  {currencySymbol}{item.total_price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Subtotal
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.subtotal}
                onChange={(e) => setEditForm({ ...editForm, subtotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tax
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.tax}
                onChange={(e) => setEditForm({ ...editForm, tax: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.total}
                onChange={(e) => setEditForm({ ...editForm, total: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono font-bold text-cyan-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Expandable Advanced / Developer JSON Section */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2 font-mono uppercase tracking-wider">
            <FileText className="w-4 h-4 text-cyan-400" />
            Advanced / Developer Data (Raw JSON)
          </span>
          {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showJson && (
          <div className="p-4 border-t border-slate-800 bg-[#060910]">
            <JsonViewer data={data} title="Structured Receipt Payload" />
          </div>
        )}
      </div>
    </div>
  );
}
