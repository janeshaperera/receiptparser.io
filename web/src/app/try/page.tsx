import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReceiptUploadExperience from "@/components/ReceiptUploadExperience";
import { Sparkles } from "lucide-react";

export default function TryItPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Simple & Fast
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Upload your receipt
          </h1>
          <p className="text-base text-slate-300">
            Drop your receipt here and we&apos;ll extract the important information for you.
          </p>
        </div>

        <ReceiptUploadExperience />
      </main>
      <Footer />
    </>
  );
}
