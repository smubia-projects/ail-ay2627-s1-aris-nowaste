"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function KitchenIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 11 9-7 9 7v9h-6v-6H9v6H3Z"/></svg>; }
function CommunityIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20v-2.5A5.5 5.5 0 0 1 9 12a5.5 5.5 0 0 1 5.5 5.5V20ZM14 14a4.5 4.5 0 0 1 6.5 4v2H17"/></svg>; }
function CoachIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21V10M12 14C8 14 5 11 5 7c4 0 7 3 7 7ZM12 11c0-4 3-7 7-7 0 4-3 7-7 7Z"/></svg>; }
function MoreIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>; }

const primaryLinks = [
  { href: "/dashboard", label: "Kitchen", Icon: KitchenIcon },
  { href: "/community", label: "Community", Icon: CommunityIcon },
  { href: "/coach", label: "Coach", Icon: CoachIcon },
];

const moreLinks = [
  { href: "/upload", label: "Upload" },
  { href: "/responsible-ai", label: "Responsible AI" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// AI Lodge showcase: no accounts and no Telegram bot, so no sign-in menu or Telegram link.
export function SiteNav() {
  const pathname = usePathname();
  const linkClass = (href: string) => `hand-nav-link ${isActive(pathname, href) ? "hand-nav-active" : ""}`;
  const moreActive = moreLinks.some(({ href }) => isActive(pathname, href));

  return <nav className="hand-nav flex w-full min-w-0 items-center justify-between gap-1 text-sm font-bold sm:w-auto sm:justify-start sm:gap-2" aria-label="Main navigation">
    {primaryLinks.map(({ href, label, Icon }) => <Link key={href} href={href} className={linkClass(href)} aria-current={isActive(pathname, href) ? "page" : undefined}><Icon/><span>{label}</span></Link>)}
    <details className="group relative">
      <summary className={`hand-nav-link cursor-pointer list-none [&::-webkit-details-marker]:hidden ${moreActive ? "hand-nav-active" : ""}`}><MoreIcon/><span>More</span><span aria-hidden="true" className="inline-block text-xs transition group-open:rotate-180">▾</span></summary>
      <div className="hand-menu absolute right-0 z-50 mt-2 min-w-44 border border-[#164b3530] bg-[#fffaf0] py-2 shadow-[0_12px_30px_rgba(22,75,53,.14)]">
        {moreLinks.map(({ href, label }) => <Link key={href} href={href} className={`block px-4 py-2.5 ${isActive(pathname, href) ? "bg-[#edf5ef] text-[#164b35]" : "text-[#526259] hover:bg-[#f4f1e9] hover:text-[#164b35]"}`} aria-current={isActive(pathname, href) ? "page" : undefined}>{label}</Link>)}
      </div>
    </details>
    <span className="hand-demo-pill">Demo</span>
  </nav>;
}
