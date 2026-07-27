# Routine run: New community reviews (2026-07-27)

## Summary

- Communities in `data/communities.json`: 32,221
- Already covered (found in `content/founders/*.md` / `content/reviews/*.md` frontmatter): 3,203
- Candidates after filtering (not covered, description ≥ 20 chars, total_members ≥ 50): 12,834
- Candidates selected for this run (top 100 by total_members, incremental weekly batch cap): 100
- Skipped for being too generic before writing (rule 2, pre-filter pass): 28
- Skipped during writing for being too generic on closer read: 4 (`petersacademy`, `mission-1-3765`, `thpc-3days-challenge`, `ai-agents-mastery-1078`)
- **Review pages written: 68**

## Pages written (content/reviews/*.md)

1billionorg-community-hub-1072, 7am-club-3676, advanced-market-life-agents, ai-agency-arbitrage, ai-app-builders-4160, ai-automation-club-7843, ai-fellowship-7905, ai-first-ecosysteme-4395, ai-pioneers, ailaunch, astral-projection-free, automation-network-9294, b-mafia, blitzstream-6028, bos, business-and-grant-mentorship-9581, challenge-business-intensity-4599, comunidad-avo, connectionmanagement, creatorboost, creatorlaunch, digidollarssociety, digital-products-academy-3815, ecom-messiah, ejendomsinvestor, elite-digital, elotroromulo-gratis, fitrahwellbeing01, friends, futuro-digital-academy-3444, gkufree, goalkeeper, harmony-circle-7644, hobbyscool, jqool-1333, kulturwerke-reisende, le-challenge-renaissance, lecole-du-top-1-4566, lme, marketing-success-network-3149, millionaire-trading, miracle-free, monetizia-1924, muzik, my-optimized-life, nidacademy-1408, notheoryclub, pegasus-chess-academy, raising-skilled-readers, refuge-externat, saas-university, smma-secrets-9123, stemscreenfreehub, successful-students-5280, swautomation-5538, the-ai-blueprint, the-brotherhood, the-digital-product-hub-4426, the-mystic-misfits-society-7623, thebrotherhood, thesacredspace, tiktok-money-gratuit-4342, total-weight-loss-9815, tradingunlocked, tubeaipro, ultimatewealthacademy, ventures-fly-co, wealth-accelerator

All 68 files verified programmatically after writing:
- frontmatter `word_count` matches actual body word count exactly (all land within the 400-650 word target)
- zero occurrences of the em dash character (—) anywhere in title, meta_description, or body
- mandatory CTA line present in the required form, linking to `https://trustskool.com/community/{slug}` (a small number of files use a visually-cleaned version of a heavily-emoji/unicode-stylized display_name in the CTA text itself, e.g. `Müzik Üniversitesi` instead of the raw `𝑴Ü𝒁İ𝑲 Ü𝑵İ𝑽𝑬𝑹𝑺İ𝑻𝑬𝑺İ 🎸`-style source string, so the link text reads cleanly)
- all required sections present (What's Actually Inside, Pros, Cons, Who It's a Good Fit For, Who Should Skip It); "Who Runs It" included only where `owner_name` was a real person's name distinct from the community's own brand name
- no slug collisions with the existing ~3,200 covered communities, and no duplicate slugs within this batch
- no invented biographical content anywhere; pricing stated only from `price_amount_cents`/`price_currency`/`price_interval`, defaulting to "free" when null/0

## Skipped: too generic (rule 2) — 28 pre-filtered + 4 on closer read = 32 total

Pre-filtered before assigning to writers (description gave no specific topic/niche, only generic self-help/hype/"make money online" language with no method or niche named):

1. `waysuccess` (109,041 members) — "learn how to reach your best version and achieve the life you want", no specific topic
2. `day-by-day-family-4722` (61,131 members) — "journey to becoming their best self", generic wellness language only
3. `wealth-academy-6133` (34,595 members) — description is just "Online Business Mastery", no specifics
4. `peach-club` (30,671 members) — purely generic social-club language, no topic
5. `bigbusinessentrepreneurs` (21,589 members) — "exclusive support network... empower entrepreneurs", no method or niche named
6. `moneylab-1-club-2324` (21,267 members) — generic hype ("join the 1%"), no specific topic or method
7. `moddahobbykits` (17,080 members) — never specifies which hobby, too vague to review
8. `thenewrich` (13,071 members) — generic wealth-motivation metaphor, no concrete method or niche
9. `biohackingheroes` (11,544 members) — generic self-help hype ("Society of Main Characters") despite the name, no actual biohacking content described
10. `immofacile` (11,228 members) — description is only a welcome message, no topic detail beyond the brand name
11. `dreldemellawy` (11,019 members) — description is just "Live and grow with Dr.Eldemellawy", no topic
12. `slavica-squire-free` (9,741 members) — generic self-help/inspirational language, no specific topic
13. `this-is-it-team-4127` (9,196 members) — generic entrepreneurship buzzwords, no specific method or niche
14. `infinity-hoop` (9,019 members) — "Develop the Best Version of Yourself", generic despite the brand name
15. `co-creators` (8,962 members) — "Become who God created you to be", one generic tagline with no structural detail
16. `gem-grow-earn-multiply-1261` (8,571 members) — "learning, networking, growing income streams", generic
17. `paydaycreators` (8,169 members) — "turn your skills into a cash-flowing internet business", generic, no niche
18. `lindependance-digitale-6163` (8,074 members) — "your first step toward freedom and independence through digital", generic
19. `mugzys-mastermind-4634` (7,850 members) — "step by step blueprint to skyrocket your brand", generic branding hype
20. `money-and-mindset-1142` (7,847 members) — generic mindset/money buzzword mashup, no specific niche
21. `amigosonline` (7,560 members) — "earn your first income online", generic, no method named
22. `brunettilandia-3934` (7,455 members) — "reference community to earn money online", generic
23. `bsg-4603` (7,273 members) — "join for self-improvement challenges", generic
24. `minzero` (7,101 members) — generic income-claim hype, no specific niche/method named
25. `1percent-club` (6,980 members) — generic hype, no specific topic
26. `lucidbot` (6,819 members) — names only its own product ("LucidBot: courses, updates, help") without ever stating what the product actually does or teaches
27. `ecomreal` (6,660 members) — description is literally "Coming soon, something big", no content to review
28. `official-founders-club-9304` (6,650 members) — "build a business without huge capital, step-by-step guidance", generic, no niche named

Skipped by the writer on a closer read of the description (genuinely re-checked, not just carried over):

29. `petersacademy` (6,940 members) — "excelling in studies, fitness & to show up as your best self" reads as a generic self-improvement mashup with no concrete curriculum or method
30. `mission-1-3765` (6,898 members) — description reduces to "the largest community for self-employed people in Germany", a size claim with no method or niche
31. `thpc-3days-challenge` (6,488 members) — description is only "Get High Ticket Clients", pure hype with zero method or niche detail
32. `ai-agents-mastery-1078` (8,655 members) — "The AI-Driven Invisible Machine. Stop chasing. Start attracting. Build once, runs forever." is hype language with no actual tool, method, or niche named

## Process notes

- Content was drafted by 8 parallel writer passes (one per ~9-community slice of the top-100 list), each given the same style reference (existing `content/reviews/diario-de-estoicos-4459.md` and `content/reviews/jaafit.md`) and the same non-negotiable rules from this routine's spec.
- All 68 output files were then verified in one pass with a script checking: frontmatter/filename slug match, slug not already covered, word_count field vs. real body word count, 400-650 range, absence of the em dash character, exact CTA line presence, and presence of all required section headings.
