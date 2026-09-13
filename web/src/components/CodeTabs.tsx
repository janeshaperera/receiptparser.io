"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeTabsProps {
  apiEndpoint?: string;
}

export default function CodeTabs({ apiEndpoint = "https://api.receiptparser.io/v1/parse" }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "javascript" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST ${apiEndpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/receipt.jpg"`,

    javascript: `import fs from "fs";

const formData = new FormData();
formData.append("file", new Blob([fs.readFileSync("receipt.jpg")]), "receipt.jpg");

const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
  },
  body: formData,
});

const data = await response.json();
console.log(data);`,

    python: `import requests

url = "${apiEndpoint}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    "file": open("receipt.jpg", "rb")
}

response = requests.post(url, headers=headers, files=files)
print(response.json())`
  };

  const currentCode = snippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("curl")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "curl"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            cURL
          </button>
          <button
            onClick={() => setActiveTab("javascript")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "javascript"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            JavaScript
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "python"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Python
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800"
          aria-label="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
        <code>{currentCode}</code>
      </pre>
    </div>
  );
}
