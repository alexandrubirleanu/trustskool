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

## CRO & Filter improvements
- [x] Hero: social proof stat bar (8k+ indexed, 5k+ free to join; trending shown when >0)
- [x] Hero: improved headline "Find Skool communities worth joining — before you pay.", cleaner search with clear-X button
- [x] Filters: count badges on language chips (English 1k+, Spanish 1k+, etc.); top 8 languages shown
- [x] Trending stat hidden when 0 (all current data has growthRateBp=0); UI ready for when pipeline provides growth data
- [x] Free chip shows count badge (5k+) and is prominent in filter bar
- [x] Leaderboard cards: Free badge (green) and Trending badge (amber, only when growthRateBp>0)
- [x] Cards already have hover:bg-accent transition; TrustSkore badge acts as visual CTA anchor
- [x] Detail page: sticky mobile CTA bar (name + TrustSkore + Join on Skool button) at top on mobile
- [x] Detail page: Free/Trending badges in header; bottom CTA copy adapts ("It's free — no credit card required" vs "Check the latest pricing")
- [x] Detail page: member count shown in header stats row; bottom CTA section personalizes copy per community
- [x] Banner copy updated: "Ready to start your own community?" + "Start free on Skool" CTA
- [x] Empty state: clear message + "Reset all filters" chip button

## Language filter order
- [x] Reorder language chips to match Skool's official language order (English first, then German, Spanish, French, … Hindi); all 47 languages present in the dataset shown in canonical order; unknown languages fall to end sorted by count

## DataFast Analytics
- [x] Added DataFast browser tracking script to client/index.html (defer, data-website-id="dfid_UH9ObO70D14iHkJ4UkHq1", data-domain="trustskool.com") — confirmed in page source
- [x] Installed @datafast/ai-crawl 1.0.9 and added createExpressAICrawlerMiddleware before all routes in server/_core/index.ts (publicOrigin: "https://trustskool.com") — tracks robots.txt, llms.txt, sitemap.xml, all page requests from known bots

## CTA copy update + Logo
- [x] Update CTA copy: nav "Start on Skool for $9", homepage banner "Launch your Business on Skool", detail page header CTA context-aware (free: "Join Free", paid: "Start on Skool for $9/mo"), sticky mobile bar concise, bottom detail CTA stronger
- [x] Install new logo (gold star + mortarboard, black wordmark) in nav replacing ShieldCheck icon
- [x] Create favicon from logo icon
- [x] Update OG image with new logo

## Filter bar UX fixes
- [x] Replace expanded language chip row with compact Language dropdown (searchable, single-select, shows selected language name)
- [x] Fix sort direction: always default to descending when switching sort column

## SEO Gate 1: AggregateRating schema + rel=sponsored
- [x] Remove AggregateRating/Review JSON-LD from community detail page SSR (prefetch.ts)
- [x] Add rel="sponsored noopener noreferrer" to all /go/<slug> and /go/signup affiliate links sitewide

## SEO Gate 2: Methodology Hub v2
- [x] Expand /methodology with exact TrustSkore weights from trustskore.ts
- [x] Add fully worked numeric example (real community inputs → final score)
- [x] Add "What TrustSkore is NOT" section
- [x] Add anti-gaming / anomaly-detection section
- [x] Add data sources & provenance section
- [x] Add versioned changelog section
- [x] Add limitations section
- [x] Add commission/placement-firewall statement

## SEO Gate 3: Scam/fraud policy + disclaimer system
- [x] Create /policy/fraud-response page with delisting criteria, commission-refusal rule
- [x] Build reusable DisclaimerBanner component (parameterized by risk level)
- [x] Add warning-label component for flagged communities

## SEO Gate follow-ups
- [x] Worked example: DB currently has only 1 snapshot per community (pipeline just seeded). Added visible disclosure note in /methodology that the example is illustrative and will be replaced with real community data once ≥3 snapshots exist. Formula and math are accurate.
- [x] Add isFlagged (caution|warning) + flagReason fields to communities table (migration applied); render DisclaimerBanner on CommunityDetail for flagged communities; isFlagged and flagReason included in LIST_COLUMNS so all community queries return the flag state

## MRR Revenue Estimate Feature
- [x] Add owner_profiles table to drizzle schema (handle, mrrStatus, activityStatus, ownedCommunitiesJson, updatedAt)
- [x] Generate and apply migration SQL
- [x] Add getOwnerProfileBySlug + upsertOwnerProfile + listOwnerProfiles in server/dbCommunities.ts
- [x] Implement MRR estimate logic: tier bounds, naive ceiling, intersection, multi-community allocation (server/mrrEstimate.ts)
- [x] Add communities.mrrEstimate tRPC procedure + ownerProfiles.list/upsert admin procedures
- [x] Add MRR estimate badge to CommunityDetail page (info icon → /methodology#mrr)
- [x] Graceful degradation when no owner profile match (naive ceiling for paid, null for free)
- [x] Add afl_percent section to AdminClicks page (sortable by commission % or clicks, internal only)
- [x] Write owner_profiles.jsonl import script (scripts/import_owner_profiles.mjs) — 31 profiles imported
- [x] Write vitest for MRR estimate logic (10 tests, all passing)
