import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = { title: "NoWaste!", description: "Receipt-to-pantry food waste prevention" };

// AI Lodge showcase: no accounts; every page is the browser-only demo.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="noise">
    <header className="site-header">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-5 py-3 sm:flex-nowrap">
      <Link href="/" className="hand-brand"><span className="brand-spark" aria-hidden="true">‹</span><Image src="/nowaste-vegetable-logo.png" alt="" width={56} height={56} className="size-12 object-contain sm:size-14" priority/><span>NoWaste!</span><span className="brand-spark" aria-hidden="true">›</span></Link>
      <SiteNav/>
      </div>
    </header>
    {children}
    <footer className="mx-auto mt-20 max-w-6xl border-t border-[#164b3530] px-5 py-8 text-sm text-[#567061]"><details><summary className="cursor-pointer font-black text-[#164b35]">AI handles ambiguity. Rules handle safety.</summary><div className="mt-3 grid gap-4 sm:grid-cols-2"><p><b>AI:</b> receipt interpretation, product normalization, optional descriptions and matching relevance.</p><p><b>Deterministic logic:</b> freshness, recommendation math, sharing eligibility, reservation states, location privacy and waste statistics.</p></div></details><p className="mt-4">NoWaste! predicts freshness priority, not food safety. Storage and handling conditions may change every estimate.</p><p className="mt-3"><Link href="/privacy" className="font-bold text-[#164b35] underline">Privacy policy</Link></p><p className="mt-3">Built by Aris Haiquel at the AI Lodge hackathon · <a href="https://www.smubia.com/ailodge" target="_blank" rel="noopener noreferrer" className="underline">Join AI Lodge</a> · <a href="https://www.smubia.com/Projects" target="_blank" rel="noopener noreferrer" className="underline">Explore other projects</a> · <a href="https://github.com/smubia-projects/ail-ay2627-s1-aris-nowaste" target="_blank" rel="noopener noreferrer" className="underline">View on GitHub</a></p></footer>
  </body></html>;
}
