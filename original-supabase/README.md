# Original Supabase + Telegram version (not deployed)

Aris Haiquel's original backend: the Next.js API routes (`app/api/*`: Telegram webhook/link/open, receipts
upload/confirm, pantry and demo actions, community, the daily freshness cron), Supabase auth and clients, the
Telegram bot, the cookie-based guest demo, USDA enrichment, the Vercel cron config, and the original server-rendered
pages. Kept for reference. These files sit outside `app/` so Next.js does not route or deploy them, and they are
excluded from the TypeScript build and ESLint. The schema stays in `supabase/migrations/`.
