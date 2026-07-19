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

## Datafa.st Custom Goals
- [x] Create useDatafast hook (window?.datafast wrapper)
- [x] skool_click: track /go/signup links (nav desktop, nav mobile, home banner) — affiliate link to create a Skool community
- [x] community_click: track /go/:slug CTA clicks (header, mobile_bar, bottom_cta) — affiliate link to join a specific community; also track card click on homepage list
- [x] search_used: track search input (debounced, min 3 chars) with query param — fires once per distinct query
- [x] blog_cta_click: implemented on NewsArticle and ResourceArticle bottom CTA "Browse all communities" links (track("blog_cta_click", {source, slug})); ResourceArticle skool_click CTA already had data-fast-goal attribute
- [x] Fix free trial: removed 7-day trial badge and CTA (no trial field in dataset); monthly paid → "Join for $X/mo"; getPriceType updated; dbCommunities free filter no longer includes monthly; hero stat label fixed to "free to join"
- [x] Pre-filter homepage in English by default: language state initialized to 'english'; English chip pre-selected on load
- [x] Mobile deep dive: CommunityCard (3px gap, 10px avatar, description visible line-clamp-1, price shown, score 10x10); Home (hero 24px heading, filter bar horizontally scrollable, sort self-end, pagination h-10 active:scale); CommunityDetail (sticky bar compact h-8, header mt-4 gap-3, logo 14x14, h1 text-xl, description line-clamp-2, stats text-xs, score 14x14 row layout on mobile, ChartCard empty state h-36 with message, founder px-4, bottom CTA py-8 gap-3)
- [x] [AUDIT-3] ownerJoined (boolean) + ownerJoinedAt (timestamp) columns in communities table; admin mutation toggleOwnerJoined; checkbox/filter in AdminClicks
- [x] [AUDIT-2] Pull afl_percent + mrrStatus + ownerName + active30d_streak into communities table columns from ingestion dataset; update ingestion.ts to map these fields; MRR UI gets real data
- [x] [AUDIT-1] Add 'review' to contentPages.type enum; add /founders/:slug and /reviews/:slug routes in App.tsx; build FounderPage and ReviewPage components; SSR meta tags; sitemap entries after routes are live
- [x] [AUDIT-4] Admin decision-support view in /admin/clicks: click count + TrustSkore + afl_percent + ownerJoined per community, sortable; toggleOwnerJoined mutation with optimistic invalidate
- [x] [AUDIT-5] Tiered click-notification emails: shouldSendTierA() updated with notYetJoined gate; ownerJoined passed from httpRoutes.ts to ClickNotification; already-joined communities downgraded to digest
- [x] [AUDIT-6] Sitemap index: /sitemap.xml as sitemapindex; /sitemap-communities-N.xml (10k chunks, static pages in chunk 1); /sitemap-content.xml (founder/review/category/guide/pillar/faq/skool-news); robots.txt Sitemap: points to index; llms.txt updated
- [x] Remove duplicate hero search bar; keep only the header search
- [x] Optimize above-the-fold: tighter hero padding (py-8/py-12), two-column desktop layout (headline left, stats right), mobile compact with stat pills inline, description shortened for mobile
- [x] Bootstrap TrustSkore: isBootstrapScore() helper (>=2000 members, <3 snapshots); computeBreakdownWithBootstrap() returns growth_momentum=80/ranking_momentum=75 for bootstrap communities; ingestion.ts switched to computeBreakdownWithBootstrap; isBootstrap flag stored in scoreBreakdown JSON; CommunityDetail shows amber inline note when breakdown.isBootstrap=true; ScoreBreakdown type extended with optional isBootstrap field; 12 new tests (isBootstrapScore x7, computeBreakdownWithBootstrap x5); 59/59 tests passing
- [x] Free trial differentiation: monthly paid communities show "Start 7-Day Free Trial" CTA + "7-day trial" badge (purple); 100% free show "Join Free" (green); annual show "Join for $X/yr"; one-time show "Join for $X"; getPriceType() helper in format.ts; all 3 CTA locations updated (mobile_bar, header, bottom_cta); price_type tracking updated to use priceType enum
- [x] Add datafast queue snippet to index.html head for reliable tracking

## Content ingestion (content/ → routes)
- [x] Read content-decision.md rule #12 for founder page routing logic
- [x] Create DB tables: content_pages (slug, type, title, meta_description, body_html, frontmatter_json, published_at)
- [x] Write import script: parse all content/*.md files, store in DB (60 files imported)
- [x] Server: tRPC procedures for content pages (by slug, by type, list)
- [x] Frontend: founder bio folded into /community/:slug as "About the Founder" section (rule #12)
- [x] Frontend: /resources hub (guides + pillar articles, grid layout, type badges)
- [x] Frontend: /resources/:slug article reader with JSON-LD Article schema
- [x] Frontend: /news listing (skool-news, newest first)
- [x] Frontend: /news/:slug article reader
- [x] Nav: Resources + News links in desktop nav, mobile nav, footer
- [x] SSR head meta for all content pages

## Admin: afl_percent in admin panel
- [x] afl_percent surfaced as sortable table in /admin/clicks (sort by commission % or by click count)

## Click notification email revamp (Tier A / Tier B)
- [x] At click time: lookup owner_profiles by slug → determine Tier A (paid + afl_percent > 0) vs Tier B
- [x] Tier A: real-time email includes est. commission (price × afl_percent), subject shows commission amount
- [x] Tier B: suppress real-time email for free/unknown-commission communities
- [x] /api/scheduled/digest callback registered; buildDigestEmail + sendDailyDigest implemented
- [x] getClicksForDigest(since, until) DB helper with community join
- [x] All clicks still logged to DB regardless of tier (admin stays complete)
- [x] Register daily digest Heartbeat cron job at 09:00 UTC via admin panel or startup provisioning (taskUid EQbQmy9kAjAE339Rke3aYw, next run 2026-07-19T09:00:00Z)

## Content routes follow-ups
- [x] Add SSR head meta (title, description, canonical, OG) for /resources, /resources/:slug, /news, /news/:slug, /faq, /faq/:slug, /categories/:slug in prefetch.ts
- [x] Add Article JSON-LD to /resources/:slug and NewsArticle JSON-LD to /news/:slug
- [x] Build /categories/:slug pages using content/categories framing copy + community list filtered by category
- [x] Build standalone /faq index + /faq/:slug article reader
- [x] provisionDigestJob + listScheduledJobs admin tRPC procedures added (idempotent, calls /api/scheduled/digest at 09:00 UTC daily)
- [x] Activate digest cron: "Activate daily digest" button added to /admin/clicks panel (amber dot = inactive, green dot = active; idempotent, one-time setup)

## TrustSkore floor fix + tiered update pipeline
- [x] Fix TrustSkore: member-count floor added (computeTrustSkoreWithFloor) — 10k+→82, 5k-9999→78, 2k-4999→72, 1k-1999→67, 500-999→62, <500→50; floor only applied when history is insufficient (≤1 data point)
- [x] Build tiered scheduler: hot (top 500), warm (501-3000), cold (3001+); recomputeAllTiers() runs after each hot-tier ingestion
- [x] Discovery: new communities in pipeline dataset auto-upserted by existing ingestion path (upsert-on-conflict)
- [x] SLA monitor: checkSlaBreach() queries lastScrapedAt per tier; runSlaMonitor() sends alert email if any tier has overdue communities
- [x] Alert email: buildSlaAlertEmail() with tier breakdown, hours overdue, SLA targets table
- [x] Tiered heartbeat jobs registered: ingest-hot (daily 02:00 UTC, taskUid 4B5w4urybpTaXHixXAJvCj), ingest-warm (Mon 03:00 UTC, taskUid PfaLpTspczNWKBBJnvVoMP), ingest-cold (1st/month 04:00 UTC, taskUid U8Ee5iSCwQzu8oUXFGq3pz), sla-monitor (daily 08:00 UTC, taskUid GZBMieBvUUFWCuwpt5zyKn)
- [x] 20 new vitest tests for floor logic, hasInsufficientHistory, computeTrustSkoreWithFloor, tier thresholds, SLA windows — all 47 tests passing
- [x] runTieredIngestion refactored: fetches full dataset once, slices by rank window (hot: 0-500, warm: 500-3000, cold: 3000+), upserts only tier slice, marks lastScrapedAt only for processed communities; TS errors fixed (export communityRecordSchema, export sendSlaAlertEmail)

## Copy & Typography fixes
- [x] Remove all -- (em-dash via double hyphen) from copy across all components; replace with proper punctuation or rewrite naturally (audit 2026-07-18: fixed remaining real instances across Home.tsx hero, Methodology.tsx, FraudResponse.tsx, FaqArticle.tsx, CategoryPage.tsx, FaqHub.tsx, ResourcesHub.tsx, prefetch.ts SEO meta, emailNotify.ts email copy + placeholder glyphs, AdminClicks.tsx)
- [x] Fix footer text wrap: prevent single-word orphans in footer columns (verified: SiteLayout.tsx footer description paragraph already has text-balance applied)
- [x] Fix bottom CTA copy on community detail: remove em-dash from "Monthly subscription — check the latest pricing" (verified: that copy string no longer exists, already reworded in an earlier pass)
- [x] Add logo to OG image meta tag and ensure favicon uses the star+mortarboard icon consistently across all pages (verified: favicon-16/32/ico + apple-touch-icon present in client/public, ogImage set in prefetch.ts)

## Fraud Report Form
- [x] Add submitFraudReport tRPC mutation (publicProcedure): validates input (communitySlug/URL, reporterEmail, description, evidence), inserts into fraud_reports table, sends email to owner's personal email via Resend (verified 2026-07-18: implemented as `fraudReport.submit` in server/routers.ts, calling insertFraudReport + sendFraudReportEmail)
- [x] Create fraud_reports table in schema (id, communitySlugOrUrl, reporterEmail, description, evidence, createdAt, status) (verified: fraudReports table in drizzle/schema.ts + server/dbFraudReports.ts)
- [x] Build FraudReportForm component with fields: community URL/name, your email, description, evidence (optional); honeypot + rate-limit guard (verified: implemented as `ReportForm` component, rendered in FraudResponse.tsx)
- [x] Add form section to FraudResponse.tsx page below the existing policy content (verified: "Submit a report" section renders <ReportForm /> after the policy sections)
- [x] Email to owner: branded HTML with all report fields, reply-to set to reporter's email (verified: sendFraudReportEmail/buildFraudReportEmail in server/emailNotify.ts, destination configurable via FRAUD_REPORT_EMAIL env)

## Audit 2026-07-18: production data staleness (NOT a code bug)
- [x] **Root cause confirmed**: the live site's homepage stat still reads "8k+ communities indexed" and the English-filtered leaderboard shows "1000 communities" — both match the OLD dataset (8,154-8,170 communities, pre-expansion), not the current 22,502-community data/communities.json. This is a data-freshness/ingestion-execution issue, not a logic bug. Requires a manual ingestion trigger from the admin panel after confirming deploy is current with main.
- [x] Verified by direct simulation: code path is correct (TrustSkore 82.25 expected for aivideobootcamp). The flat 60.0 on all communities is a data-freshness issue, not a logic bug.
- [x] **ACTION REQUIRED (operational, not code)**: Manually trigger a full ingestion run via /admin/clicks after confirming deploy is current. Verify: community count reaches ~22,502, 2,000+-member communities show TrustSkore ~72-82, CommunityDetail shows isBootstrap note.
- [x] **Clear button verified working** (2026-07-18): Tested in dev server. Clicking Clear correctly resets Language dropdown to "Language" (from "English"), removes the Clear button, and shows all 8,154 communities. The "zero visible change" reported was due to data staleness (all communities have TrustSkore 60.0 flat, so reordering is invisible). The code is correct. No fix needed.

## Real community counter
- [x] Hero stat pills now show exact locale-formatted numbers (e.g. 22,502) instead of rounded k+ abbreviations; fmtK updated to n.toLocaleString()

## llms.txt restructure (2026-07-18)
- [x] Rewrote llms.txt with rich editorial structure: What TrustSkool is, How TrustSkore works (with concrete examples per sub-score), What TrustSkore does NOT measure, Data coverage stats, Key pages, Affiliate disclosure (transparent), How to cite, Machine-readable exports, Featured English communities section (top-10 with description + Join affiliate link), Featured free communities section, All top-50 listing with affiliate Join links
- [x] editorialNote() helper: uses real community description if >30 chars, else generates factual fallback from member count + price + category
- [x] communityLine() now includes Join: https://trustskool.com/go/<slug> affiliate link for every community entry
- [x] Sections ordered for LLM comprehension: identity first, scoring second, limitations third, data coverage, then curated listings

## AI/LLM Optimization
- [x] [AI-1] Enhanced llms.txt with rich structured sections (About, Coverage, Scoring, Data, Freshness, Usage, top 50 communities)
- [x] [AI-2] Added /llms-full.txt endpoint (top 200 communities, machine-readable, served from seoRoutes.ts)
- [x] [AI-3] JSON-LD improvements: homepage @graph (WebSite+SearchAction, Organization, ItemList); community detail @graph (BreadcrumbList + Organization with additionalProperty array for TrustSkore, memberCount, price)
- [x] [AI-4] robots.txt updated with explicit AI crawler rules: GPTBot, ClaudeBot, PerplexityBot, anthropic-ai, cohere-ai, Meta-ExternalAgent (all allowed, no restrictions)
- [x] [AI-5] Added <link rel="llms-txt" href="/llms.txt"> to client/index.html <head> for AI crawler discovery
- [x] [AI-6] getTopCommunitiesForLlms(limit) DB helper added to dbCommunities.ts with isNull(isFlagged) filter

## SEO Optimization (2026-07-18 - Manus score 56 -> 90+)
- [x] [SEO-1] Fix all img alt tags: logo, community thumbnails in leaderboard, community detail hero image
- [x] [SEO-2] Removed duplicate llms-txt link from index.html head (was in both index.html and vite.ts SSR head builder; kept only in SSR builder)
- [x] [SEO-3] Add manifest.json (web app manifest) with name, icons, theme_color, start_url
- [x] [SEO-4] Fix Google Fonts: added font-display=swap to Google Fonts URL, preload critical Roboto woff2
- [x] [SEO-5] Add twitter:site content="@trustskool" meta tag to SSR head builder
- [x] [SEO-6] Add meta name="theme-color" content="#F8F7F5" to index.html
- [x] [SEO-7] Improve LCP: added fetchPriority="high" to community detail hero logo image
- [x] [SEO-8] Community detail title format improved: uses | separator for better CTR ("Name · TrustSkore X | TrustSkool")

## Filter Fix + OG Image + Sitemap (2026-07-18)
- [x] [FILTER-1] Fix SSR/client language mismatch: prefetch.ts seeds cache with language:undefined but Home.tsx initializes language:"english" — causes double-fetch and filter instability on mount. Fixed: prefetch.ts now uses language:"english" to match client initial state
- [x] [OG-1] Custom OG image per community: /api/og/community/:slug endpoint (server/ogImage.ts) generates 1200x630 PNG with community logo, name, category chip, description, TrustSkore/Members/Price badges, trustskool.com branding. prefetch.ts ogImage now points to this endpoint for all community detail pages.
- [x] [SITEMAP-1] Sitemap verified live: /sitemap.xml (sitemapindex with 1 community chunk + content sitemap), /sitemap-communities-1.xml (8,154 community URLs + 5 static pages), /sitemap-content.xml. All correct.

## Mobile Filter Bar (2026-07-18)
- [x] [MOBILE-1] Mobile filter bar redesigned: Row 1 = price chips + language (horizontally scrollable, shrink-0 on each chip) + Clear pinned right; Row 2 = community count left + Sort buttons right (shortLabel "Score/Members/Growth" on mobile, full label on sm+). No wrapping on 390px viewport.

## Admin OTP Gate (2026-07-18)
- [x] [ADMIN-1] adminOtps table created (id, email, codeHash, expiresAt, usedAt, createdAt) in drizzle/schema.ts; migration generated + applied
- [x] [ADMIN-2] Backend: adminOtp.requestOtp procedure (publicProcedure) — validates email against allowlist, generates 6-digit OTP, stores SHA-256 hash in DB, sends branded OTP email via Resend
- [x] [ADMIN-3] Backend: adminOtp.verifyOtp procedure — validates code hash, sets signed 30-min admin session JWT cookie (ADMIN_OTP_COOKIE_NAME), marks OTP as used
- [x] [ADMIN-4] adminProcedure middleware updated to accept OTP session cookie as alternative to Manus OAuth admin role (hasValidOtpSession in trpc.ts)
- [x] [ADMIN-5] Frontend: /admin page with OTP gate (email input → code input → full AdminDashboard with all existing admin features)
- [x] [ADMIN-6] /admin/clicks now renders same Admin component as /admin (both routes in App.tsx)
- [x] [ADMIN-7] Allowlist: only alexbirle97@gmail.com and alexbirle@hey.com can request OTP
- [x] [ADMIN-8] adminOtp.checkSession + adminOtp.logout procedures added; Sign out button in AdminDashboard

## Community Detail Mobile UX (2026-07-18)
- [x] [DETAIL-1] Sticky CTA bar moved to bottom (fixed bottom-0); slides in with translate-y transition only when main CTA block is scrolled off-screen (IntersectionObserver on mainCtaRef)
- [x] [DETAIL-2] TrustSkore badge + Join button centered on mobile (flex-col items-center); button full-width on mobile (w-full), auto on desktop (md:w-auto)

## Admin OTP Bug Fix (2026-07-18)
- [x] [ADMIN-BUG-1] Root cause: req.cookies was always undefined because no cookie-parser middleware is registered in server/_core/index.ts. Fixed: checkSession in routers.ts and hasValidOtpSession in trpc.ts now use parseCookieHeader(req.headers.cookie) directly (same pattern as sdk.ts authenticateRequest). Verified: checkSession returns authenticated:true when valid JWT cookie is sent.
- [x] [ADMIN-BUG-2] Secondary issue: after first failed code attempt, user saw "code expired" on retry because the OTP was consumed on the first (successful server-side) verification, but the cookie was never readable. Fix above resolves both symptoms.

## Dockerfile for OG image (2026-07-18)
- [x] [DOCKER-1] Dockerfile added at project root: node:22-slim base + libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi8 (required by @napi-rs/canvas for OG image generation). Full pnpm build inside image, NODE_ENV=production, CMD node dist/index.js.

## FiltersBar Redesign v2 (2026-07-18)
- [x] [FILTERS-1] Replaced two-row filter bar with single-row FiltersBar component: "Filters" dropdown button (SlidersHorizontal icon + active count badge) opens panel with Price section (All/Free/Paid) + Language section; Sort buttons (Score/Members/Growth short labels on mobile, full on sm+) take remaining space; Clear button (X icon) when filters active; community count below the row. No overflow on 390px viewport.

## Admin UX Improvements (2026-07-18)
- [x] [ADMIN-UX-1] Added Tooltip components to all three action buttons in /admin header: "Activate daily digest" (explains Tier-B cron, 09:00 UTC, one-time setup), "Run ingestion now" (explains GitHub dataset fetch, 8k→22k+ update, ~30-60s), "Sign out" (explains cookie clearing + re-auth needed)
- [x] [ADMIN-UX-2] Added Tooltip to "Joined" toggle in Opportunity view table: explains affiliate link activation status, shows different text for joined vs unjoined state

## Homepage SEO Fixes (2026-07-18)
- [x] [SEO-HP-1] Rewrite homepage title from 61 chars to 50 chars: "TrustSkool: Skool Communities Ranked by TrustSkore" (was "TrustSkool: Skool community leaderboard, ranked by TrustSkore")
- [x] [SEO-HP-2] Rewrite homepage description from 188 chars to 151 chars: "TrustSkool ranks 22,000+ Skool communities by TrustSkore, built from member growth, rank momentum, and price stability. Find communities worth joining."
- [x] [SEO-HP-3] Add meta keywords tag (6 keywords): "Skool communities, TrustSkore, Skool leaderboard, Skool community reviews, free Skool communities, Skool ranking". Added keywords field to HeadMeta type and buildHeadTags() in vite.ts.

## Ingestion Fix + Full Dataset Load (2026-07-18)
- [x] [INGEST-FIX-1] Fixed active_30d_streak schema in ingestion.ts: pipeline sends boolean (True/False) but schema expected integer. Added z.union([z.number(), z.boolean()]) with transform (true→1, false→0). All 22,502 records now parse and upsert correctly.
- [x] [INGEST-RUN-1] Ran full ingestion: 22,502 communities upserted, 0 skipped, 0 errors. DB updated from 8,154 to 22,502 communities. Top TrustSkore is now 82.25 (vs flat 60.0 before).

## Rankings Feature + Content Import (2026-07-19)
- [x] [PULL-1] Pull commit 18b4913 from main via webdev_save_checkpoint sync
- [x] [IMPORT-1] Run content import for ~3,200 new pages (reviews, founders, guides, FAQ)
- [x] [INGEST-2] Re-ingest dataset at 23,338 communities
- [x] [RANKINGS-1] Create categoryRankings DB table + Drizzle migration
- [x] [RANKINGS-2] Build computeCategoryRankings() helper in dbRankings.ts
- [x] [RANKINGS-3] Build /rankings index page (9 category cards, SSR)
- [x] [RANKINGS-4] Build /rankings/:category page (ranked list, SSR, JSON-LD ItemList)
- [x] [RANKINGS-5] Add monthly Heartbeat cron (1st of month) for snapshot computation
- [x] [RANKINGS-6] Add admin manual recompute trigger
- [x] [RANKINGS-7] Add /rankings/* to sitemap-communities-1.xml (static pages in chunk 1)
- [x] [RANKINGS-8] Initial snapshot computed: 270 rows (30 per category × 9 categories)

## Three UX + Ops Improvements (2026-07-19)
- [x] [CRON-1] Register nightly ingestion Heartbeat cron (daily 03:00 UTC) — taskUid VF8HamKFy8P77ZrwDUgkMf; provisionNightlyIngestion admin procedure + button added to Admin panel
- [x] [FILTER-COUNT-1] Show filtered community count in FiltersBar when filters are active (uses data.total from existing query)
- [x] [PAGINATION-1] Add go-to-page input field next to Prev/Next pagination buttons (form with number input, submit on Enter)

## CommunityDetail Section Reorder (2026-07-19)
- [x] [DETAIL-REORDER-1] Reorder sections: Growth History → TrustSkore Breakdown → Estimated Revenue → About the Founder → Similar Communities
- [x] [DETAIL-SEO-1] Added itemScope/itemType Person schema + rel=author link to full founder profile page
- [x] [DETAIL-SEO-2] Improved heading and added descriptive subtitle for similar communities section

## Affiliate Click Email Notifications (2026-07-19)
- [x] [AFFILIATE-EMAIL-1] Diagnosed: aflPercent was read only from ownerProfile (often null); community.aflPercent (populated from dataset) was ignored
- [x] [AFFILIATE-EMAIL-2] Fixed: httpRoutes.ts now uses community.aflPercent as fallback when ownerProfile doesn't have the data; added console logging for production debugging
- [x] [AFFILIATE-EMAIL-3] Already included in existing buildClickEmail: name, members, price, commission estimate, language, click count, timestamp, referrer, Skool URL

## TrustSkore Redesign + Growth % Feature (2026-07-19)
- [x] [SKORE-1] Audited: 20381 at 60.0 (87%), 328 with 2+ snapshots, 109 with non-zero growthRateBp
- [x] [SKORE-2] Redesigned: continuous log-scale floor = 45 + 45*log10(n)/5; 180 unique scores vs 4 before
- [x] [SKORE-3] growthRateBp shown on cards as growth chip; formula uses real snapshot delta for 328 communities with 2+ snapshots
- [x] [SKORE-4] Added 7/30/90d period selector to community detail growth charts; 30d/90d auto-disabled when insufficient data
- [x] [SKORE-5] Re-ran ingestion: 23338 upserted; distribution 85-89:15, 80-84:837, 70-74:1721, 65-69:3912, 60-64:16853

## Card Layout Redesign (2026-07-19)
- [x] [CARD-1] Two-row layout on mobile: row 1 = avatar + title + TrustSkore, row 2 = price/members/growth + chips (Free/Trending)
- [x] [CARD-2] Spotlight badge for category #1 community (golden ring border + Crown icon + #1 [Category] badge)
- [x] [CARD-3] Compact chip design: emoji icon + text, chips on second row so no overflow on narrow screens

## TrustSkore Redesign + Growth % + Period Selector (2026-07-19)
- [x] [SKORE-1] Expanded memberCountFloor to 10 tiers: <100→50, 100+→55, 200+→60, 500+→65, 1k+→70, 2k+→75, 5k+→80, 10k+→84, 25k+→87, 50k+→90; continuous distribution instead of 4 flat buckets
- [x] [SKORE-2] growthRateBp from real 2-day snapshots used as growth_momentum input (328 communities with real delta); ingestion.ts cleaned up
- [x] [SKORE-3] Added 7/30/90d period selector to community detail growth chart; 30d/90d auto-disabled when not enough data; filterByPeriod() clips all three charts consistently
- [x] [SKORE-4] Ingestion running in background (PID 26584) to recompute all 23338 TrustSkore values with new 10-tier floor
- [x] [SKORE-5] Updated tieredIngestion.test.ts: 10 new floor tier assertions + computeTrustSkoreWithFloor expectations updated; 62/63 tests pass (1 Resend network timeout)

## Card Layout Redesign (2026-07-19)
- [x] [CARD-1] Two-row layout on mobile: row 1 = avatar + title + TrustSkore, row 2 = price/members/growth + chips (Free/Trending)
- [x] [CARD-2] Spotlight badge for category #1 community (golden ring border + Crown icon + #1 [Category] badge)
- [x] [CARD-3] Compact chip design: emoji icon + text, chips on second row so no overflow on narrow screens

## Category Filter + Scroll-to-top (2026-07-19)
- [x] [CAT-1] Add category filter chip to FiltersBar (Money, Tech, Health, Hobbies, Spirituality, Self-improvement, Sports, Relationships, Music)
- [x] [CAT-2] Wire category filter to listCommunities tRPC query
- [x] [SCROLL-1] Add scroll-to-top on page change (Prev/Next and go-to-page)

## Growth Display Improvement (2026-07-19)
- [x] [GROWTH-1] Hide growth chip on cards when value is +0.0% (abs(growthRateBp) < 10 bp); show only meaningful growth/decline

## Language Filter Persistence (2026-07-19)
- [x] [LANG-1] Default language = "english" on first visit (already works)
- [x] [LANG-2] clearAllFilters() resets language to "english" instead of undefined
- [x] [LANG-3] On mount: if localStorage shows last visit was 7+ days ago, reset language to "english" regardless of any saved state; update lastVisit timestamp on every mount

## Navigation UX (2026-07-19)
- [x] [NAV-SCROLL-1] Scroll to top on every route change (global, covers all internal navigation)
- [x] [FOOTER-1] Rankings link already present in footer navigation (verified)

## URL-Persistent Filters + Breadcrumb (2026-07-19)
- [x] [URL-FILTER-1] Serialize category, price, language into URL query params (?category=tech&price=free&lang=english); read them on mount to restore state; update URL on every filter change without pushing to history
- [x] [BREADCRUMB-1] Add visible breadcrumb UI on CommunityDetail: Home > [Category] > [Community name], with clickable links

## Live Activity Toast (2026-07-19)
- [x] [LIVE-1] Build LiveActivityToast component: bottom-left fixed toast showing "Someone is viewing [community]" and "Someone just joined [community]" using real community names from leaderboard data, with plausible timing simulation
- [x] [LIVE-2] Wire LiveActivityToast to homepage — only shown when leaderboard data is loaded

## Language URL + Dynamic OG (2026-07-19)
- [x] [URL-LANG-1] Serialize language into URL param (?lang=italian) for all non-English selections; keep English omitted from URL (clean default)
- [x] [OG-1] Add dynamic Open Graph meta tags on homepage for filtered URLs: title/description change based on active category, price, language filters

## Sitemap + Toast Detail + Score Rebalance (2026-07-19)
- [x] [SITEMAP-1] Add filtered category/price pages to sitemap.xml (/?category=tech, /?price=free, etc.)
- [x] [TOAST-DETAIL-1] Add LiveActivityToast to community detail page using same-category communities
- [x] [SCORE-1] Rebalance TrustSkore: memberCountFloor ceiling 90→76, bootstrap 80/75→68/65; re-ran recompute-scores.mjs (12,601 updated / 10,737 unchanged)

## Unique Score Per Community (2026-07-19)
- [x] [SCORE-UNIQUE-1] Add micro-perturbation to memberCountFloor (floor) and computeTrustSkore (composite): community-id-based seed ensures unique scores; 4551 unique scores vs 530 before; 23297 communities updated

## Methodology Page Update (2026-07-19)
- [x] [METHODOLOGY-1] Update floor reference values on Methodology page: 1k→63.6, 10k→69.8, 100k→76 (was 72/81/90); bootstrap 80/75→68/65; added v1.2 changelog entry; updated llms.txt bootstrap text

## Score Recalibration (2026-07-19)
- [x] [SCORE-RECAL-1] Growth curve recalibrated: pct/7 → pct/2.5 so +3% → ~82, +5% → ~91, +10% → ~98
- [x] [SCORE-RECAL-2] Bootstrap raised to 85/82 (v3); composite score ~87 for 2000+ member communities
- [x] [SCORE-RECAL-3] Recomputed 852 communities; max score now 87.0, range 60-87; Methodology v1.3 changelog added

## MRR Badge + Category Rank (2026-07-19)
- [x] [MRR-1] Create getMrrBadge() helper in format.ts: clover=$3k-$10k, rocket=$10k-$30k, crown=$30k-$100k, diamond=$100k-$300k, red_diamond=$300k-$1M, goated=$1M+
- [x] [MRR-2] Expose mrrStatus in listCommunities via LIST_COLUMNS in dbCommunities.ts (bySlug already returns full row)
- [x] [MRR-3] Show MRR range badge on CommunityCard and CommunityDetail (only when mrrStatus is set and not null/none)
- [x] [CAT-RANK-1] Compute categoryRank server-side via correlated subquery in LIST_COLUMNS (COUNT(*)+1 of communities with higher score in same category)
- [x] [CAT-RANK-2] categoryRank exposed in listCommunities via LIST_COLUMNS; CommunityDetail uses (community as any).categoryRank from bySlug
- [x] [CAT-RANK-3] Show "#N in [Category]" on CommunityCard (top 50 only) and CommunityDetail (top 100 only)

## Unique Score Enforcement + Category Rank Fix (2026-07-19)
- [x] [UNIQUE-1] Guarantee every community has a unique TrustSkore: integer-based uniqueness pass (score×100) resolves 23336 collisions; only 40.00 floor duplicates remain (irrelevant micro-communities)
- [x] [UNIQUE-2] Re-ran recompute-scores.mjs; 2439 updated, 20899 unchanged; top community scores now 79.59/79.58/79.57... (all distinct)
- [x] [CAT-RANK-FIX-1] Fixed isCategoryTop to use dynamic trustSkore comparison instead of stale categoryRankings table; now exactly 1 community per category is #1

## Score Distribution Spread (2026-07-19)
- [x] [SPREAD-1] Bootstrap formula v4: continuous member-count-based formula (2k→62, 10k→74, 100k→87); top 15 scores now 87.82/87.1/86.83/86.55/86.41... (visually distinct); 850 communities updated

## Revenue Filter + Methodology V4 (2026-07-19)
- [x] [MRR-FILTER-1] Add "Revenue verified" toggle to FiltersBar dropdown (shows only communities with mrrStatus != null)
- [x] [MRR-FILTER-2] Wire mrrVerified filter to listCommunities tRPC query and dbCommunities WHERE clause
- [x] [METHODOLOGY-V4-1] Update Methodology page: bootstrap formula v4 continuous formula documented (2k→67/62, 10k→74/69, 100k→85/80); v1.4 changelog added
