# TrustSkool TODO

## Data layer & TrustSkore engine
- [x] Drizzle schema: communities table (full record + histories as JSON), clicks table, app config/constants
- [x] Apply migration SQL to database
- [x] TrustSkore engine: weighted score (growth momentum, ranking momentum, price stability) computed from history arrays
- [x] Data ingestion endpoint /api/scheduled/ingest: fetch dataset JSON from GitHub repo (raw), upsert communities; pipeline trust_score is source of truth when present, TrustSkore engine recomputes when missing (intentional passthrough)
- [x] Manual ingestion trigger (admin tRPC mutation) for first load and testing
- [x] Seed initial data via real ingestion path with sample dataset (16 communities; pipeline will overwrite via cron)
- [x] Daily Heartbeat cron job hitting /api/scheduled/ingest daily at 05:00 UTC (taskUid aNsLtqhujmfKpKe8EUnnBZ, next run 2026-07-19)

## Frontend pages
- [x] Design system: warm off-white #F8F7F5, near-black #202124, muted #909090, borders #E4E4E4, Roboto + IBM Plex Sans, flat (no shadows), 4px buttons, 25px pill chips
- [x] Top-nav responsive: TrustSkool branding, search bar, Methodology link
- [x] Homepage: hero, search, filters (language, category, free/paid), sortable leaderboard (TrustSkore desc default, members, growth, category), community cards
- [x] Secondary CTA banner -> /go/signup
- [x] Community detail page /community/<slug>: info, TrustSkore + 3 sub-indicators, 3 Recharts charts (members line, price step, rank inverted; animation disabled for reliable first paint), Join on Skool CTA -> /go/<slug>, similar communities
- [x] Methodology page
- [x] Footer: affiliate disclosure, not-affiliated-with-Skool note, Methodology link, llms.txt link

## Click tracking & notifications
- [x] /go/<slug> and /go/signup Express routes: log click (slug, display name, timestamp, referrer), send email via Resend, 302 redirect with ref=92733312bcf942809d665dd976c25eee
- [x] Config: ref code + notification email centralized (shared/appConfig.ts)
- [x] Request RESEND_API_KEY and NOTIFICATION_EMAIL secrets (validated via vitest)
- [x] Email sent before redirect with 3s timeout guard; failures logged, never block the visitor
- [x] /admin/clicks page: admin-only, click counts per community (most-clicked first) + full click table (name, timestamp, referrer) + manual ingestion trigger
- [x] Email delivery fixed: sends from verified alexandrubirleanu.it domain (EMAIL_FROM overridable once trustskool.com verifies on Resend); delivery to alexbirle@hey.com confirmed (200)

## SEO
- [x] SSR conversion: per-route title/meta/OG tags, canonical, 404 status (verified dev + prod build; SSR fallback shell on render failure)
- [x] sitemap.xml (homepage + methodology + all community pages), robots.txt with sitemap + llms.txt reference
- [x] llms.txt page + footer link
- [x] JSON-LD structured data (ItemList on home, Organization + AggregateRating per community)
- [x] CANONICAL_ORIGIN=https://trustskool.com and SITE_NAME env (validated via seo.env.test.ts)

## Quality
- [x] Vitest tests: 16 tests passing across 4 files (TrustSkore engine, ingestion mapping, email builder, redirect targets, Resend auth, SEO envs + escaping)
- [x] Visual verification: desktop full-page screenshots (home, detail, methodology, admin) and mobile 375px screenshots (all four pages) inspected — layout, charts, filters, tables, and nav render as designed; test click rows cleaned from DB
- [x] Checkpoint saved (version 81777506) + delivery

## Follow-up
- [x] Switch notification email sender to noreply@trustskool.com: code updated, DNS records confirmed added by owner (propagation in progress — Resend will auto-verify once DNS resolves)
- [x] Update EMAIL_FROM default to noreply@trustskool.com (serverConfig.emailFrom, overridable via EMAIL_FROM env)
- [x] Rewrite all email notification copy in English: subject [TrustSkool] Outbound click — {name}, branded HTML table, CTA button, automated footer; vitest updated and all 16 tests passing

## Real data ingestion + email enrichment
- [x] Run ingestion against real data/communities.json (8,154 communities) — repo made public, all 8,154 upserted (0 skipped), DB now has 8,170 total
- [x] Enrich click notification email: Members, Price ($X/month|Free), Language, Clicks (running count for slug); 17 vitest tests passing
- [x] Confirmed: Heartbeat cron calls /api/scheduled/ingest — lightweight fetch+upsert only (no scraping); cost is one HTTP request + DB upserts per day

## CTA button styling
- [x] Updated primary CTA buttons to #F8D481 bg / #202124 text / font-bold / 4px radius / no border / no shadow: "Start on Skool" nav (desktop + mobile), "Join on Skool" detail page, "Create your Skool community" banner — all secondary buttons unchanged
