import { GuestCoachExperience } from "@/components/GuestCoachExperience";

// AI Lodge showcase: the Coach runs on the demo purchase history (deterministic math, no AI). The original
// Supabase-backed Coach is in original-supabase/coach-page.tsx.
export default function CoachPage() {
  return <main className="mx-auto max-w-6xl px-5 pb-10 pt-6"><header className="mb-2 pt-6"><p className="eyebrow">Demo data</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Learn from what leaves your kitchen.</h1><p className="mt-4 max-w-2xl text-[#526259]">The coach uses deterministic purchase history and outcome math. Every number below traces back to a recorded event.</p></header><GuestCoachExperience/></main>;
}
