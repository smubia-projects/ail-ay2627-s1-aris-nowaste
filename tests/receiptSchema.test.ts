import { describe, expect, it } from "vitest";
import { receiptSchema } from "@/schemas/receipt";
import { coerceReceipt } from "@/lib/receiptParser";

describe("receipt structured output", () => {
  it("accepts valid grocery extraction", () => {
    expect(receiptSchema.parse({ store_name: "FairPrice", purchase_date: "2026-10-05", currency: "SGD", items: [{ raw_receipt_name: "CHKN BRST", normalized_name: "Chicken breast", brand: null, quantity: 1, unit: "500 g", price: 6.95, food_category: "raw_poultry", perishable: true, confidence: .94, needs_review: false }] }).items).toHaveLength(1);
  });
  it("rejects invented categories and invalid confidence", () => {
    expect(() => receiptSchema.parse({ store_name: null, purchase_date: null, currency: null, items: [{ raw_receipt_name: "?", normalized_name: "?", brand: null, quantity: 1, unit: null, price: null, food_category: "made_up", perishable: true, confidence: 2, needs_review: false }] })).toThrow();
  });
});

describe("per-item receipt validation", () => {
  it("keeps good items, maps unknown categories and fills missing fields", () => {
    const { extraction, dropped } = coerceReceipt({ store_name: "Sahan", purchase_date: "08/11/2026", currency: "eur", items: [
      { raw_receipt_name: "MILK 1L", normalized_name: "Milk", brand: null, quantity: 1, unit: "1 L", price: 1.29, food_category: "dairy", perishable: true, confidence: 0.9, needs_review: false },
      { raw_receipt_name: "SNOEP", normalized_name: "Candy", quantity: "2", price: "0,99", food_category: "snacks" },
      { normalized_name: "" },
    ] });
    expect(extraction.items).toHaveLength(2);
    expect(extraction.items[1]).toMatchObject({ food_category: "unknown", quantity: 2, perishable: true, needs_review: true, confidence: 0.5 });
    expect(extraction.currency).toBe("EUR");
    expect(extraction.purchase_date).toBeNull();
    expect(dropped).toHaveLength(1);
  });
  it("throws when there is no items array", () => {
    expect(() => coerceReceipt({ store_name: "x" })).toThrow();
  });
});
