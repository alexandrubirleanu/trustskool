# Routine run: New community reviews (2026-09-28)

## Summary

- Communities in `data/communities.json`: 32,221
- Already covered (found in `content/founders/*.md` / `content/reviews/*.md` frontmatter): 3,203
- Candidates after filtering (not covered, description >= 20 chars, total_members >= 50): 12,834
- Candidates selected for this run (top 100 by total_members, incremental weekly batch cap): 100
- Skipped for being too generic (rule 2): 30
- **Review pages written: 70**

## Pages written (content/reviews/*.md)

1billionorg-community-hub-1072, 7am-club-3676, advanced-market-life-agents, ai-agency-arbitrage, ai-app-builders-4160, ai-automation-club-7843, ai-fellowship-7905, ai-first-ecosysteme-4395, ai-pioneers, ailaunch, astral-projection-free, automation-network-9294, b-mafia, blitzstream-6028, bos, business-and-grant-mentorship-9581, challenge-business-intensity-4599, comunidad-avo, connectionmanagement, creatorboost, creatorlaunch, digidollarssociety, digital-products-academy-3815, ecom-messiah, ejendomsinvestor, elite-digital, elotroromulo-gratis, fitrahwellbeing01, friends, futuro-digital-academy-3444, gkufree, goalkeeper, hobbyscool, infinity-hoop, jqool-1333, kulturwerke-reisende, le-challenge-renaissance, lecole-du-top-1-4566, lme, lucidbot, marketing-success-network-3149, millionaire-trading, minzero, miracle-free, monetizia-1924, muzik, my-optimized-life, nidacademy-1408, notheoryclub, pegasus-chess-academy, raising-skilled-readers, refuge-externat, saas-university, smma-secrets-9123, stemscreenfreehub, successful-students-5280, swautomation-5538, the-ai-blueprint, the-brotherhood, the-digital-product-hub-4426, the-mystic-misfits-society-7623, thebrotherhood, thesacredspace, tiktok-money-gratuit-4342, total-weight-loss-9815, tradingunlocked, tubeaipro, ultimatewealthacademy, ventures-fly-co, wealth-accelerator

All 70 files verified programmatically after writing:
- frontmatter `word_count` matches actual body word count (1 file, `fitrahwellbeing01`, was off by 7 words and corrected to match)
- body word count falls within the 400-650 target range
- zero occurrences of the em dash character (—) anywhere in title, meta_description, or body
- mandatory CTA line present in the exact required form linking to `https://trustskool.com/community/{slug}`
- all required sections present (intro, What's Actually Inside, Who Runs It, Pros, Cons, Who It's a Good Fit For, Who Should Skip It)
- no slug collisions with the existing 3,203 covered communities, and no existing files were overwritten (confirmed via `git status`, all 70 are new untracked files)
- one transcription defect caught in manual spot-check: the agent writing `ailaunch.md` mistyped the community's stylized Unicode display name ("...MONEY..." rendered as "...MONGs...") in two places; corrected to match the exact `display_name` from the dataset

## Skipped: too generic (rule 2) - 30 total

Description gave no specific topic/niche beyond generic self-help/wealth/hype language, so no page was written:

1. `waysuccess` (109,041 members) - "learn how to reach your best version and achieve the life you want", no specific topic
2. `day-by-day-family-4722` (61,131 members) - "journey to becoming their best self", generic wellness language only
3. `wealth-academy-6133` (34,595 members) - description is just "Online Business Mastery", no specifics
4. `peach-club` (30,671 members) - purely generic social-club language ("Peach Perfect"), no topic
5. `bigbusinessentrepreneurs` (21,589 members) - "exclusive support network... empower entrepreneurs", no method or niche named
6. `moneylab-1-club-2324` (21,267 members) - generic Arabic motivational hype, no specific topic or method
7. `moddahobbykits` (17,080 members) - never specifies which hobby, too vague to review honestly
8. `thenewrich` (13,071 members) - generic Vietnamese wealth-motivation metaphor, no concrete method or niche
9. `biohackingheroes` (11,544 members) - despite the slug, description is generic "main character" self-help hype with no actual biohacking content described
10. `immofacile` (11,228 members) - bare welcome greeting ("Bienvenue dans la communauté Skool d'Immofacile") with no content detail beyond the brand name itself; same slug the 2026-07-20 routine already examined and skipped for the identical reason, kept consistent with that precedent
11. `dreldemellawy` (11,019 members) - description is just "Live and grow with Dr.Eldemellawy", no topic
12. `slavica-squire-free` (9,741 members) - generic Serbian self-help/inspirational language, no specific topic
13. `this-is-it-team-4127` (9,196 members) - generic entrepreneurship hype, no specific method or niche
14. `co-creators` (8,962 members) - "Become who God created you to be", one line, no content detail
15. `ai-agents-mastery-1078` (8,655 members) - "AI-Driven Invisible Machine... Stop chasing, Start attracting", pure hype, no concrete topic
16. `gem-grow-earn-multiply-1261` (8,571 members) - "learning, networking, and growing your income streams", generic money community
17. `paydaycreators` (8,169 members) - "Turn your skills into a cash-flowing internet business in 2 days per week", no method named
18. `lindependance-digitale-6163` (8,074 members) - "first step toward freedom through digital", no specific method
19. `mugzys-mastermind-4634` (7,850 members) - "Get the Step by Step Blueprint to skyrocket your Brand", generic
20. `money-and-mindset-1142` (7,847 members) - generic mindset/money/faith language, no specific method
21. `amigosonline` (7,560 members) - "learn to earn your first income online with real help from people like you", generic
22. `brunettilandia-3934` (7,455 members) - "reference community for earning online", no specific method despite named founder
23. `bsg-4603` (7,273 members) - "Join for self-improvement challenges", one line, no detail
24. `harmony-circle-7644` (7,215 members) - generic marketing bullet list ("24/7 Chat Support, Exclusive Resources"), no specific method
25. `1percent-club` (6,980 members) - generic Chinese "become top 1%" motivational language, no specific niche
26. `petersacademy` (6,940 members) - "excelling in studies, fitness & showing up as your best self", generic motivational quote
27. `mission-1-3765` (6,898 members) - "largest community for self-employed people in Germany", no specific niche
28. `ecomreal` (6,660 members) - description is literally "Pronto algo grande" ("something big coming soon"), no content at all
29. `official-founders-club-9304` (6,650 members) - "learn to build a business without huge capital", generic despite a notable $25,000/year price
30. `thpc-3days-challenge` (6,488 members) - "Get High Ticket Clients", four words, no method named

## Process notes

- No external research (WebFetch/WebSearch) was used anywhere in this run. Every claim in every review comes only from the fields in `data/communities.json` (description, display_name, owner_name, price fields, total_members, language). No founder biography was invented for any community; where `owner_name` was present it was stated plainly with a note that no further background is available. Several owner_name values were clearly brand/account handles reused as the "owner" (e.g. "Infinity Hoop", "Nid Academy", "SW Automation", "Kulturwerke Deutschland") rather than a person, and were described as such rather than turned into an invented individual bio.
- Pricing was taken directly from `price_amount_cents` / `price_currency` / `price_interval`; communities with a null or zero amount were stated as free. 5 communities in this batch are paid: `thebrotherhood` ($47/month), `notheoryclub` ($9/month), `ecom-messiah` ($100/month), `ai-app-builders-4160` ($100/month), and `pegasus-chess-academy` ($9, billing interval not specified in the data so the review does not assert a cadence).
- Work was split across 8 parallel batches of 8-9 communities each; each batch was independently instructed on tone, rules, and format (each agent first read 2-3 existing review files to match style), then the full output was re-verified programmatically against every non-negotiable rule (word count match, em dash, CTA format/exact display_name, slug match, required sections) plus a manual spot-check of several files for tone and factual honesty.
- One file (`immofacile`) was written by the batch-1 agent but removed after review for being too generic per rule 2, consistent with the same call made on the same slug in the 2026-07-20 routine.
- Several communities deal with sensitive topics (mental/emotional health, peptide/biohacking research, spirituality, nervous-system regulation, astral projection, body image); these were described neutrally and factually, without asserting unproven claims as fact, and with explicit notes that the content isn't a substitute for licensed medical, financial, or legal advice where relevant.
- Unverified marketing and income claims in source descriptions (e.g. "#1 SMMA Community in the world", "$20k+/month working less than 4h/day", "555 validated business ideas", "€5,000-10,000/month in 3 days", "$3,000-$30,000/month from crypto") were flagged explicitly in each review's Cons section rather than repeated as fact.
