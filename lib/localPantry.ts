// The visitor's pantry, kept in this browser (AI Lodge showcase: no accounts, no database).
// Replaces the Supabase pantry_items table and the cookie-based guest demo: the same freshness rules and
// rescue metrics run on these records. First visit: seeded with the original guest-demo groceries.
import { defaultStorageFor, getStorageRule } from "@/lib/foodkeeper";
import { calculateFreshness } from "@/lib/freshness";
import type { KitchenItemData } from "@/lib/foodVisuals";
import { guestKitchenItems } from "@/lib/guestDemoData";
import { calculateRescueMetrics, type OutcomeItem, type RescueMetrics } from "@/lib/rescueMetrics";
import type { ReceiptExtraction } from "@/schemas/receipt";
import type { StorageMethod } from "@/types/pantry";

export const PANTRY_KEY = "nowaste-pantry-v1";
const DAY = 86_400_000;

export type PantryRecord = Omit<KitchenItemData, "freshness"> & OutcomeItem & { status: "active" | "consumed" | "discarded" };
export type PantryAction = "consumed" | "frozen" | "discarded" | "storage";

function seed(): PantryRecord[] {
  return guestKitchenItems().map(({ freshness: _freshness, ...item }) => ({
    ...item,
    ...rule(item.food_category, item.storage_method),
    status: "active",
    consumed_at: null, frozen_at: null, discarded_at: null, rescued_at: null, action_risk: null, discard_reason: null,
  }));
}

function rule(category: string, storage: StorageMethod) {
  const r = getStorageRule(category, storage);
  return { shelf_life_min_days: r?.min_days ?? null, shelf_life_max_days: r?.max_days ?? null };
}

export function loadPantry(): PantryRecord[] {
  try {
    const raw = window.localStorage.getItem(PANTRY_KEY);
    if (raw) return JSON.parse(raw) as PantryRecord[];
  } catch {}
  const seeded = seed();
  savePantry(seeded);
  return seeded;
}

export function savePantry(records: PantryRecord[]) {
  try {
    window.localStorage.setItem(PANTRY_KEY, JSON.stringify(records));
  } catch {}
}

export function resetPantry() {
  try {
    window.localStorage.removeItem(PANTRY_KEY);
  } catch {}
}

/** Active items with freshness calculated for `now` (simulated date in the demo controls), highest priority first. */
export function kitchenItems(records: PantryRecord[], now: Date): KitchenItemData[] {
  return records
    .filter((r) => r.status === "active")
    .map((r) => {
      const { status: _s, consumed_at: _c, frozen_at: _f, discarded_at: _d, rescued_at: _r, action_risk: _a, discard_reason: _dr, ...item } = r;
      return { ...item, freshness: calculateFreshness(r.purchase_date, r.shelf_life_max_days, now) };
    })
    .sort((a, b) => (b.freshness.riskScore ?? -1) - (a.freshness.riskScore ?? -1));
}

export function pantryMetrics(records: PantryRecord[], now: Date): RescueMetrics {
  return calculateRescueMetrics(records, now);
}

/** Records an outcome or a storage move (what /api/pantry/item-action did in the database). */
export function applyAction(
  records: PantryRecord[],
  id: string,
  action: PantryAction,
  now: Date,
  options: { storageMethod?: StorageMethod; discardReason?: string } = {},
): { records: PantryRecord[]; price: number | null } {
  const current = records.find((r) => r.id === id && r.status === "active");
  if (!current) throw new Error("Item not found");
  const risk = calculateFreshness(current.purchase_date, current.shelf_life_max_days, now).riskScore;
  const timestamp = now.toISOString();
  let patch: Partial<PantryRecord>;
  if (action === "consumed") patch = { status: "consumed", consumed_at: timestamp, rescued_at: timestamp, action_risk: risk };
  else if (action === "discarded") patch = { status: "discarded", discarded_at: timestamp, discard_reason: options.discardReason ?? null, action_risk: risk };
  else {
    const storage = action === "frozen" ? "freezer" : options.storageMethod ?? current.storage_method;
    patch = {
      storage_method: storage,
      ...rule(current.food_category, storage),
      ...(action === "frozen" ? { frozen_at: timestamp, rescued_at: timestamp, action_risk: risk } : {}),
    };
  }
  const next = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  savePantry(next);
  return { records: next, price: current.price };
}

/** Adds a confirmed receipt's groceries (what /api/receipts/confirm did in the database). */
export function addReceipt(extraction: ReceiptExtraction, purchaseDate: string): number {
  const records = loadPantry();
  const stamp = Date.now();
  const rows: PantryRecord[] = extraction.items.map((item, index) => {
    const storage = defaultStorageFor(item.food_category);
    return {
      id: `receipt-${stamp}-${index}`,
      raw_name: item.raw_receipt_name,
      normalized_name: item.normalized_name,
      food_category: item.food_category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      purchase_date: purchaseDate,
      storage_method: storage,
      extraction_confidence: item.confidence,
      ...rule(item.food_category, storage),
      status: "active",
      consumed_at: null, frozen_at: null, discarded_at: null, rescued_at: null, action_risk: null, discard_reason: null,
    };
  });
  savePantry([...rows, ...records]);
  return rows.length;
}

export const simulatedNow = (dayOffset: number) => new Date(Date.now() + dayOffset * DAY);
