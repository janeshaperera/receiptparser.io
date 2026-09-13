import Link from "next/link";
import { Receipt } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060910] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="font-semibold text-slate-200">ReceiptParser.io</span>
          <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/docs" className="hover:text-slate-200 transition-colors">
            Docs
          </Link>
          <Link href="/#pricing" className="hover:text-slate-200 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-slate-200 transition-colors">
            Dashboard
          </Link>
          <Link href="/#try-it" className="hover:text-slate-200 transition-colors">
            API Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
