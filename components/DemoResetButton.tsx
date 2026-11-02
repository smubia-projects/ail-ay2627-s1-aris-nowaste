"use client";
import { useState } from "react";
import { resetDemoScenario } from "@/lib/demoScenario";
import { resetPantry } from "@/lib/localPantry";
import { useRouter } from "next/navigation";

export function DemoResetButton() {
  const router=useRouter();
  const [done,setDone]=useState(false);
  return <button onClick={()=>{if(!window.confirm("Clear your pantry and demo progress from this browser?"))return;resetDemoScenario();resetPantry();setDone(true);window.setTimeout(()=>{router.push("/dashboard");window.location.reload()},500)}} className="button border px-3 py-2 text-xs">{done?"Demo reset ✓":"Reset demo"}</button>;
}
