import cors from "cors";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { aiConfigured } from "@/lib/llm";
import { parseReceiptImage } from "@/lib/receiptParser";
import { generateRecipes, type PantryRecipeItem } from "@/lib/recipes";
import { limitRecipes, receiptCharge } from "./rateLimit";

/**
 * NoWaste! API (Cloud Run). API-only and stateless: the Next.js app is on Vercel and keeps the pantry in the
 * visitor's browser. Receipt photos travel in the request body and are never stored.
 *
 *   GET  /api/health          -> {"status":"ok"}
 *   POST /api/receipts/parse  { image }  -> { purchaseDate, extraction }   [receipt]  vision: read + normalise items
 *   POST /api/recipes/rescue  { items }  -> { recipes }                    [recipes]  three ranked rescue meals
 *
 * Each route validates first, then the model is called. Recipes: the rate limiter counts the hit before the model.
 * Receipts: the hit is counted only after a successful scan (receiptCharge), so an unreadable photo costs no try.
 * (The original ran Next.js routes against Supabase, plus a Telegram bot and a daily cron; see original-supabase/.)
 */

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    // No CORS_ORIGINS set (local dev) -> allow any origin. Otherwise only the listed ones.
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)),
  }),
);

// The browser shrinks receipt photos to ~1600 px before sending; 8 MB of base64 is still allowed (the original's cap).
const MAX_IMAGE_CHARS = 11_000_000;
const json = express.json({ limit: "12mb" });

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ai: aiConfigured() });
});

const needsAi: RequestHandler = (_req, res, next) => {
  if (!aiConfigured()) return res.status(501).json({ error: "AI isn't set up on the server (missing API_KEY)." });
  next();
};

const validReceipt: RequestHandler = (req, res, next) => {
  const image = req.body?.image;
  if (typeof image !== "string" || image.length > MAX_IMAGE_CHARS || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
    return res.status(400).json({ error: "Upload a JPG, PNG, or WebP receipt up to 8 MB" });
  }
  next();
};

app.post("/api/receipts/parse", json, validReceipt, needsAi, receiptCharge.gate, async (req, res) => {
  try {
    const extraction = await parseReceiptImage(req.body.image);
    if (!extraction.items.length) return res.status(422).json({ error: "No grocery items were found. Try a clearer receipt photo." });
    const purchaseDate = extraction.purchase_date ?? new Date().toISOString().slice(0, 10);
    return receiptCharge.charge(req, res, () => res.json({ purchaseDate, extraction }));
  } catch (error) {
    console.error("Receipt parse failed", error instanceof Error ? error.message : "Unknown error");
    return res.status(502).json({ error: "We couldn't process that receipt. Please try again." });
  }
});

const validPantry: RequestHandler = (req, res, next) => {
  const raw = req.body?.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 15) return res.status(400).json({ error: "Add 1 to 15 ingredients to the Rescue Pot." });
  const items: PantryRecipeItem[] = [];
  for (const x of raw as Record<string, unknown>[]) {
    const name = typeof x?.normalized_name === "string" ? x.normalized_name.trim().slice(0, 80) : "";
    if (!name) return res.status(400).json({ error: "Each ingredient needs a name." });
    const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);
    items.push({
      normalized_name: name,
      quantity: num(x.quantity, 1),
      food_category: typeof x.food_category === "string" ? x.food_category.slice(0, 40) : "unknown",
      freshnessRisk: Math.min(100, num(x.freshnessRisk, 0)),
      price: typeof x.price === "number" && Number.isFinite(x.price) ? x.price : null,
    });
  }
  res.locals.items = items;
  next();
};

app.post("/api/recipes/rescue", json, validPantry, needsAi, limitRecipes, async (_req, res) => {
  try {
    return res.json({ recipes: await generateRecipes(res.locals.items as PantryRecipeItem[]) });
  } catch (error) {
    console.error("Recipe generation failed", error instanceof Error ? error.message : "Unknown error");
    return res.status(502).json({ error: "Couldn't think of recipes right now. Please try again." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found. This is the NoWaste! API; the app itself is on the frontend." });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-argument signature
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = Number((err as { status?: number }).status) || 500;
  if (status === 413) return res.status(413).json({ error: "That receipt photo is too large." });
  if (status === 400) return res.status(400).json({ error: "Expected JSON." });
  console.error(err);
  return res.status(500).json({ error: "Something went wrong on the server." });
};
app.use(onError);

const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`NoWaste! API listening on 0.0.0.0:${port}`);
});
