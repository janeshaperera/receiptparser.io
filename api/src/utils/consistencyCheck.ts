import { ReceiptExtraction } from "../schemas/receipt.schema.js";

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  itemSum: number;
  calculatedTotal: number;
  differenceItemsSubtotal: number;
  differenceSubtotalTaxTotal: number;
  recalculationReason?: string;
}

const FLOAT_TOLERANCE = 0.05; // $0.05 tolerance for rounding/floating point

/**
 * Checks if sum(line_items.total_price) matches subtotal
 * and subtotal + tax matches total.
 */
export function verifyReceiptConsistency(data: ReceiptExtraction): ConsistencyCheckResult {
  const itemSum = data.line_items.reduce((acc, item) => acc + (item.total_price || 0), 0);
  const diffItemsSubtotal = Math.abs(itemSum - data.subtotal);
  const calculatedTotal = data.subtotal + data.tax;
  const diffTotal = Math.abs(calculatedTotal - data.total);

  const itemsMatchSubtotal = diffItemsSubtotal <= FLOAT_TOLERANCE;
  const subtotalTaxMatchTotal = diffTotal <= FLOAT_TOLERANCE;

  if (!itemsMatchSubtotal || !subtotalTaxMatchTotal) {
    let reason = "Consistency mismatch detected: ";
    if (!itemsMatchSubtotal) {
      reason += `sum(line_items) (${itemSum.toFixed(2)}) does not match subtotal (${data.subtotal.toFixed(2)}). `;
    }
    if (!subtotalTaxMatchTotal) {
      reason += `subtotal (${data.subtotal.toFixed(2)}) + tax (${data.tax.toFixed(2)}) does not match total (${data.total.toFixed(2)}). `;
    }

    return {
      isConsistent: false,
      itemSum: Number(itemSum.toFixed(2)),
      calculatedTotal: Number(calculatedTotal.toFixed(2)),
      differenceItemsSubtotal: Number(diffItemsSubtotal.toFixed(2)),
      differenceSubtotalTaxTotal: Number(diffTotal.toFixed(2)),
      recalculationReason: reason.trim()
    };
  }

  return {
    isConsistent: true,
    itemSum: Number(itemSum.toFixed(2)),
    calculatedTotal: Number(calculatedTotal.toFixed(2)),
    differenceItemsSubtotal: Number(diffItemsSubtotal.toFixed(2)),
    differenceSubtotalTaxTotal: Number(diffTotal.toFixed(2))
  };
}
