# Routine run: New community reviews (2026-08-10)

## Summary

- Communities in `data/communities.json`: 32,221
- Already covered (found in `content/founders/*.md` / `content/reviews/*.md` frontmatter): 3,203
- Candidates after filtering (not covered, description ≥ 20 chars, total_members ≥ 50): 12,834
- Candidates selected for this run (top 100 by total_members, incremental weekly batch cap): 100
- Skipped for being too generic before writing (rule 2, pre-filter pass, consistent with the 2026-07-20/07-27/08-03 precedent list): 13
- Skipped during writing for being too generic on closer read: 10
- **Review pages written: 77**

## Pages written (content/reviews/*.md)

1billionorg-community-hub-1072, 7am-club-3676, advanced-market-life-agents, ai-agency-arbitrage, ai-app-builders-4160, ai-automation-club-7843, ai-fellowship-7905, ai-first-ecosysteme-4395, ai-pioneers, ailaunch, amigosonline, astral-projection-free, automation-network-9294, b-mafia, blitzstream-6028, bos, brunettilandia-3934, business-and-grant-mentorship-9581, challenge-business-intensity-4599, comunidad-avo, connectionmanagement, creatorboost, creatorlaunch, digidollarssociety, digital-products-academy-3815, ecom-messiah, ejendomsinvestor, elite-digital, elotroromulo-gratis, fitrahwellbeing01, friends, futuro-digital-academy-3444, gkufree, goalkeeper, harmony-circle-7644, hobbyscool, infinity-hoop, jqool-1333, kulturwerke-reisende, le-challenge-renaissance, lecole-du-top-1-4566, lme, lucidbot, marketing-success-network-3149, millionaire-trading, miracle-free, mission-1-3765, monetizia-1924, muzik, my-optimized-life, nidacademy-1408, notheoryclub, official-founders-club-9304, paydaycreators, pegasus-chess-academy, petersacademy, raising-skilled-readers, refuge-externat, saas-university, smma-secrets-9123, stemscreenfreehub, successful-students-5280, swautomation-5538, the-ai-blueprint, the-brotherhood, the-digital-product-hub-4426, the-mystic-misfits-society-7623, thebrotherhood, thesacredspace, thpc-3days-challenge, tiktok-money-gratuit-4342, total-weight-loss-9815, tradingunlocked, tubeaipro, ultimatewealthacademy, ventures-fly-co, wealth-accelerator

All 77 files verified programmatically after writing:
- frontmatter `word_count` matches actual body word count for every file (10 files had a small mismatch, 1-10 words, from the writing agents' own manual counts; corrected in frontmatter to the actual value, no content was rewritten)
- body word count falls within 400-650 for all 77 files
- zero occurrences of the em dash character (—) anywhere in title, meta_description, or body across all 77 files
- mandatory CTA line present in the exact required form linking to `https://trustskool.com/community/{slug}` for all 77 files
- all six required sections present (What's Actually Inside, Who Runs It, Pros, Cons, Who It's a Good Fit For, Who Should Skip It) for all 77 files
- no slug collisions with the existing 3,203 covered communities, and no duplicate slugs within this batch

## Skipped: too generic (rule 2) — 23 total

### Pre-filtered before writing (13)

These match the established precedent list from the 2026-07-20 launch batch (and subsequent weekly runs). They remain in the eligible-candidate pool every week because a skipped community is never written and never becomes "covered," so it resurfaces near the top of the sort each time. Re-verified this week that none of them have since had their description updated with real specifics:

1. `waysuccess` (109,041 members) — "learn how to reach your best version and achieve the life you want", no specific topic
2. `day-by-day-family-4722` (61,131 members) — "journey to becoming their best self", generic wellness language only
3. `wealth-academy-6133` (34,595 members) — description is just "Online Business Mastery", no specifics
4. `peach-club` (30,671 members) — purely generic social-club language, no topic
5. `bigbusinessentrepreneurs` (21,589 members) — "exclusive support network... empower entrepreneurs", no method or niche named
6. `moneylab-1-club-2324` (21,267 members) — generic hype ("welcome to the 1%"), no specific topic or method
7. `moddahobbykits` (17,080 members) — never specifies which hobby, too vague to review
8. `thenewrich` (13,071 members) — generic wealth-motivation metaphor, no concrete method or niche
9. `biohackingheroes` (11,544 members) — despite the slug, description is generic self-help hype with no actual biohacking/health content described
10. `immofacile` (11,228 members) — bare welcome greeting, no actual content beyond the name itself
11. `dreldemellawy` (11,019 members) — description is just "Live and grow with Dr.Eldemellawy", no topic
12. `slavica-squire-free` (9,741 members) — generic self-help/inspirational language, no specific topic
13. `this-is-it-team-4127` (9,196 members) — generic entrepreneurship hype, no specific method or niche

### Caught by the writing agents on closer read (10)

14. `gem-grow-earn-multiply-1261` ("GEM 2.0") — "learning, networking, and growing your income streams", no concrete subject, method, or niche named
15. `lindependance-digitale-6163` ("L'indépendance Digitale") — "your first step towards freedom and independence, through digital", no concrete topic beyond the word "digital"
16. `minzero` ("Min Zero") — pure income hype ("$3,000-$30,000/month"), never names the actual project, skill, or business model
17. `1percent-club` ("億趴俱樂部 1% Club") — generic aspirational hype, no concrete subject, product, or skill named; category field also null
18. `money-and-mindset-1142` ("Six Figure Society") — "Mastering Mindset, Money, and Business Growth... Guided By Faith And Discipline", no concrete subject or teaching format
19. `bsg-4603` ("The Built Different Community") — "Join for self-improvement challenges", no specifics about what the challenges cover
20. `mugzys-mastermind-4634` ("Brand Launch (Free)") — "Get the Step by Step Blueprint to skyrocket your Brand!", no industry, product type, channel, or method specified
21. `co-creators` ("Co-Creators") — "Become who God created you to be.", pure inspirational hype, no concrete subject
22. `ai-agents-mastery-1078` ("AI Launch") — "The AI-Driven Invisible Machine. Stop chasing. Start attracting.", vague marketing metaphor with no identifiable niche, tool, or method
23. `ecomreal` ("Money Switch by ECOM REAL") — "🔥 Pronto algo grande 🔥" ("something big coming soon"), zero substantive content despite the e-commerce-suggestive name

## Process notes

- No external research (WebFetch/WebSearch) was used anywhere in this run. Every claim in every review comes only from the fields in `data/communities.json` (description, display_name, owner_name, price fields, total_members, language). No founder biography was invented for any community; where `owner_name` was present it was stated plainly with a note that no further background is available. One edge case: `my-optimized-life`'s `owner_name` field itself contained the community's own name rather than a person's name, and the review states that fact plainly instead of inventing a person behind it. Another edge case: `thpc-3days-challenge`'s "3-day challenge" framing was inferred from the URL slug (not the description text) and explicitly flagged in the review as an inference rather than a confirmed fact.
- Work was split across 10 parallel batches of 8-9 communities each (87 candidates after the 13 pre-filtered skips); each batch was independently instructed on tone, rules, and format, then the full 77-file output was re-verified programmatically against every non-negotiable rule (word count match, 400-650 range, em dash, CTA format, all six required sections, slug/filename consistency, no duplicate or colliding slugs).
- 10 files had a small word_count frontmatter/actual-body mismatch (1-10 words, from differences in how individual writing agents manually counted words) caught by the post-hoc verification pass; these were corrected in place by updating the frontmatter field to the true count. No body content was altered for these fixes.
- Branch `routine/community-reviews-2026-08-10` did not already exist at run start (existing routine branches found: `routine/community-reviews-2026-07-27`, `routine/community-reviews-2026-08-03`), so this run proceeded normally.
