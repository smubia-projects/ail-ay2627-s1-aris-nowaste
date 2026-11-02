import { LocalKitchen } from "@/components/LocalKitchen";

// AI Lodge showcase: the kitchen runs in the browser (no account, no database). The original server-rendered
// Supabase dashboard is in original-supabase/dashboard-page.tsx.
export default function Dashboard() {
  return <main className="mx-auto max-w-[1500px] px-3 pb-10 sm:px-5"><LocalKitchen/></main>;
}
