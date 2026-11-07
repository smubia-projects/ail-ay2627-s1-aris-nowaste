"use client";
// The kitchen for the AI Lodge showcase: the pantry lives in this browser (lib/localPantry.ts), seeded with the
// original guest-demo groceries; receipts you upload add to it. Every action is saved, and the simulated date
// (the original demo controls) moves the freshness priorities. This replaces the cookie-based guest demo and the
// Supabase pantry (see original-supabase/).
import { useCallback, useEffect, useMemo, useState } from "react";
import { KitchenView, type PantryUpdate } from "@/components/kitchen/KitchenView";
import { RescueProgress } from "@/components/kitchen/RescueProgress";
import { applyAction, kitchenItems, loadPantry, pantryMetrics, simulatedNow, type PantryRecord } from "@/lib/localPantry";
import { readDemoScenario, writeDemoScenario } from "@/lib/demoScenario";
import { DemoResetButton } from "@/components/DemoResetButton";

export function LocalKitchen() {
  const [records,setRecords]=useState<PantryRecord[]|null>(null);
  const [dayOffset,setDayOffset]=useState(0);
  const [note,setNote]=useState("");

  useEffect(()=>{
    // Reads localStorage after mount (the server render has no storage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadPantry()); setDayOffset(readDemoScenario().dayOffset);
  },[]);

  const now=useMemo(()=>simulatedNow(dayOffset),[dayOffset]);
  const items=useMemo(()=>records?kitchenItems(records,now):[],[records,now]);
  const metrics=useMemo(()=>pantryMetrics(records??[],now),[records,now]);

  const onUpdate=useCallback<PantryUpdate>(async(id,action,options)=>{
    const result=applyAction(loadPantry(),id,action,now,options);
    return {price:result.price};
  },[now]);

  function advance(days:number){setDayOffset(writeDemoScenario({dayOffset:days}).dayOffset);setRecords(loadPantry());setNote(days?`Time advanced ${days} days. Freshness priorities updated instantly.`:"Back to today.")}

  if(!records)return null;
  return <>
    <div className="demo-strip"><div className="card p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Demo · Simulated date</p><p className="mt-1 text-sm text-[#526259]">Advance time and watch freshness priorities respond. Your pantry is saved in this browser only.</p></div><div className="flex flex-wrap items-center gap-2">{[[0,"Today"],[1,"+1 day"],[3,"+3 days"],[5,"+5 days"]] .map(([d,l])=><button key={d} onClick={()=>advance(Number(d))} className={`button border px-4 py-2 text-sm ${dayOffset===d?"bg-[#164b35] text-white":""}`}>{l}</button>)}<a href="/upload" className="button bg-[#164b35] px-4 py-2 text-sm text-white">+ Add a receipt</a><DemoResetButton/></div></div>{note&&<p className="mt-3 text-sm font-bold text-[#287557]" role="status">{note}</p>}</div></div>
    <KitchenView key={dayOffset} items={items} metrics={metrics} actionsEnabled onUpdate={onUpdate}/>
    <div className="mx-auto mt-8 max-w-6xl"><RescueProgress metrics={metrics}/></div>
  </>;
}
