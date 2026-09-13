import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CodeTabs from "@/components/CodeTabs";
import JsonViewer from "@/components/JsonViewer";
import TryItWidget from "@/components/TryItWidget";
import UsageChart from "@/components/UsageChart";
import { maskApiKey } from "@/lib/auth";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  })
}));

describe("ReceiptParser.io Web Components", () => {
  describe("maskApiKey", () => {
    it("should mask key keeping only the prefix visible", () => {
      const key = "rcpt_live_abcdef1234567890abcdef1234567890";
      const masked = maskApiKey(key);
      expect(masked.startsWith("rcpt_live_abcd")).toBe(true);
      expect(masked.includes("•")).toBe(true);
    });

    it("should handle short or empty keys gracefully", () => {
      expect(maskApiKey("")).toBe("••••••••••••••••");
      expect(maskApiKey("short")).toBe("••••••••••••••••");
    });
  });

  describe("CodeTabs", () => {
    it("renders cURL tab by default and allows switching tabs", () => {
      render(<CodeTabs />);
      expect(screen.getByText(/curl -X POST/i)).toBeInTheDocument();

      const jsButton = screen.getByRole("button", { name: "JavaScript" });
      fireEvent.click(jsButton);
      expect(screen.getByText(/const formData = new FormData()/i)).toBeInTheDocument();

      const pythonButton = screen.getByRole("button", { name: "Python" });
      fireEvent.click(pythonButton);
      expect(screen.getByText(/import requests/i)).toBeInTheDocument();
    });

    it("copies snippet to clipboard when copy button clicked", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });

      render(<CodeTabs />);
      const copyBtn = screen.getByLabelText("Copy code snippet");
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });
    });
  });

  describe("JsonViewer", () => {
    it("renders formatted JSON", () => {
      const sample = { merchant_name: "Starbucks", total: 5.75 };
      render(<JsonViewer data={sample} />);
      expect(screen.getByText(/"merchant_name"/i)).toBeInTheDocument();
      expect(screen.getByText(/"Starbucks"/i)).toBeInTheDocument();
    });
  });

  describe("TryItWidget", () => {
    it("validates file size limit (10 MB)", async () => {
      const { container } = render(<TryItWidget />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();
      
      // 11MB file
      const largeFile = new File(["a".repeat(100)], "large.png", { type: "image/png" });
      Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File exceeds 10 MB limit/i)).toBeInTheDocument();
      });
    });

    it("validates file type restrictions", async () => {
      const { container } = render(<TryItWidget />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const invalidFile = new File(["bad"], "bad.exe", { type: "application/x-msdownload" });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });
    });
  });

  describe("UsageChart", () => {
    it("renders daily bars correctly", () => {
      const sampleDays = [
        { date: "2026-03-01", count: 12 },
        { date: "2026-03-02", count: 25 },
        { date: "2026-03-03", count: 5 }
      ];
      render(<UsageChart days={sampleDays} />);
      expect(screen.getByText("2026-03-01")).toBeInTheDocument();
      expect(screen.getByText("2026-03-03")).toBeInTheDocument();
      expect(screen.getByText(/25 reqs/i)).toBeInTheDocument();
    });

    it("renders empty state when no days provided", () => {
      render(<UsageChart days={[]} />);
      expect(screen.getByText(/No usage records recorded in the past 30 days/i)).toBeInTheDocument();
    });
  });
});
