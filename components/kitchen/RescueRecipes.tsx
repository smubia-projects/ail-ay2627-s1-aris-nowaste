"use client";

import { useEffect, useState } from "react";
import type { KitchenItemData } from "@/lib/foodVisuals";
import { api, LimitError } from "@/lib/api";
import type { Recipe } from "@/schemas/recipe";

/**
 * "Cook with these": asks the API for three rescue meals built around the Rescue Pot's ingredients (one AI call),
 * ranked by how much at-risk food they use (deterministic, lib/recipeRanker.ts). The original sent this to the
 * Telegram bot's /rescue command.
 */
export function RescueRecipes({ items, onClose }: { items: KitchenItemData[]; onClose: () => void }) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api<{ recipes: Recipe[] }>("/api/recipes/rescue", {
      items: items.map((item) => ({
        normalized_name: item.normalized_name,
        quantity: item.quantity,
        food_category: item.food_category,
        freshnessRisk: item.freshness.riskScore ?? 0,
        price: item.price,
      })),
    }, 60_000)
      .then((data) => live && setRecipes(data.recipes))
      .catch((e) => {
        if (!live) return;
        if (e instanceof LimitError) onClose();
        else setError(e instanceof Error ? e.message : "Couldn't think of recipes right now.");
      });
    return () => { live = false; };
    // Runs once per click on "Cook with these" (the modal mounts per request).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="recipes-title" className="item-modal">
      <button onClick={onClose} className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-[#f1f0ea] text-lg font-bold" aria-label="Close recipes">×</button>
      <p className="eyebrow">Rescue pot · AI meal ideas</p>
      <h2 id="recipes-title" className="mt-2 pr-12 text-3xl font-black tracking-tight">Cook with {items.map((i) => i.normalized_name).join(", ")}</h2>
      {!recipes && !error && <p className="mt-6 font-bold text-[#287557]" role="status">Thinking of rescue meals…</p>}
      {error && <p role="alert" className="mt-6 font-bold text-[#a63328]">{error}</p>}
      {recipes && <ol className="mt-6 space-y-5">
        {recipes.map((r) => <li key={r.name} className="rounded-2xl border border-[#164b3520] bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-xl font-black">{r.name}</h3><span className="text-sm text-[#68766e]">{r.time_minutes} min{r.rescueScore ? ` · rescue score ${r.rescueScore}` : ""}</span></div>
          <p className="mt-2 text-sm"><b>Uses:</b> {r.ingredients_used.join(", ")}</p>
          {r.additional_ingredients.length > 0 && <p className="mt-1 text-sm text-[#526259]"><b>You may need:</b> {r.additional_ingredients.join(", ")}</p>}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[#344a3d]">{r.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol>
        </li>)}
      </ol>}
      <p className="mt-6 text-xs text-[#68766e]">AI-generated ideas, ranked by how much at-risk food they use. Check every ingredient yourself before cooking: NoWaste! predicts freshness priority, not food safety. Cook meat, fish and eggs thoroughly.</p>
    </section>
  </div>;
}
