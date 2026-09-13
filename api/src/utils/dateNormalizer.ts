/**
 * Normalizes a raw receipt date into ISO 8601 (YYYY-MM-DD).
 *
 * Rules:
 * - Uses receipt clues: currency (USD -> MM/DD/YYYY, EUR/GBP -> DD/MM/YYYY)
 * - Country/address clues if detected (e.g. USA, UK, DE)
 * - Fallback: MM/DD/YYYY
 */
export function normalizeReceiptDate(
  rawDate: string,
  currency = "USD",
  clues?: { country?: string; address?: string }
): string {
  if (!rawDate || typeof rawDate !== "string") {
    return new Date().toISOString().split("T")[0];
  }

  const cleaned = rawDate.trim();

  // If already in ISO 8601 format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Determine locale rule
  // US / CA / USD: MM/DD/YYYY
  // EU / UK / EUR / GBP: DD/MM/YYYY
  const currUpper = (currency || "").toUpperCase();
  const cluesStr = `${clues?.country || ""} ${clues?.address || ""}`.toLowerCase();

  let isEuropeanLocale =
    currUpper === "EUR" ||
    currUpper === "GBP" ||
    cluesStr.includes("uk") ||
    cluesStr.includes("united kingdom") ||
    cluesStr.includes("germany") ||
    cluesStr.includes("france") ||
    cluesStr.includes("europe");

  const isUsLocale =
    currUpper === "USD" ||
    currUpper === "CAD" ||
    cluesStr.includes("usa") ||
    cluesStr.includes("united states") ||
    cluesStr.includes("canada");

  if (isUsLocale) {
    isEuropeanLocale = false;
  }

  // Try matching common numeric patterns: DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
  const slashDashMatch = cleaned.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (slashDashMatch) {
    const [, p1, p2, p3] = slashDashMatch;

    if (p1.length === 4) {
      // YYYY/MM/DD
      const year = p1;
      const month = p2.padStart(2, "0");
      const day = p3.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    let year = p3;
    if (year.length === 2) {
      year = parseInt(year, 10) > 70 ? `19${year}` : `20${year}`;
    }

    let month = "";
    let day = "";

    const num1 = parseInt(p1, 10);
    const num2 = parseInt(p2, 10);

    // If one number is > 12, it must be the day
    if (num1 > 12 && num2 <= 12) {
      day = p1.padStart(2, "0");
      month = p2.padStart(2, "0");
    } else if (num2 > 12 && num1 <= 12) {
      month = p1.padStart(2, "0");
      day = p2.padStart(2, "0");
    } else if (isEuropeanLocale) {
      // DD/MM/YYYY
      day = p1.padStart(2, "0");
      month = p2.padStart(2, "0");
    } else {
      // Default US / Ambiguous: MM/DD/YYYY
      month = p1.padStart(2, "0");
      day = p2.padStart(2, "0");
    }

    return `${year}-${month}-${day}`;
  }

  // Try standard JS Date parse (e.g. "Oct 24, 2024")
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // If unparseable fallback to today
  return new Date().toISOString().split("T")[0];
}
