import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReceiptParser.io — Turn receipts into structured JSON",
  description: "Enterprise-grade receipt and invoice OCR & data extraction API powered by Google Gemini Vision. Built for developers and modern SaaS.",
  keywords: ["receipt parser", "ocr api", "invoice parsing", "gemini vision", "receipt json api"]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
