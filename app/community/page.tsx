import { Suspense } from "react";
import { CommunityExperience } from "@/components/community/CommunityExperience";
import { communityDemoListings } from "@/lib/communityDemoData";

// AI Lodge showcase: Community Rescue runs on demo listings in the browser (no accounts, nothing is published).
// The original Supabase-backed page is in original-supabase/community-page.tsx.
export default function CommunityPage() {
  return <main className="mx-auto max-w-[1500px] px-4 pb-12 pt-7 sm:px-5"><Suspense fallback={<div className="card p-8">Loading Community Rescue…</div>}><CommunityExperience initialListings={communityDemoListings} guest/></Suspense></main>;
}
