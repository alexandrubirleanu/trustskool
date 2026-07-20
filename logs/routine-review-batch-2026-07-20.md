# Routine run: New community reviews (2026-07-20)

## Summary

- Communities in `data/communities.json`: 32,213
- Already covered (found in `content/founders/*.md` / `content/reviews/*.md` frontmatter): 3,116
- Candidates after filtering (not covered, description ≥ 20 chars, total_members ≥ 50): 12,918
- Candidates selected for this run (top 100 by total_members, incremental weekly batch cap): 100
- Skipped for being too generic before writing (rule 2, pre-filter pass): 12
- Skipped during writing for being too generic on closer read: 1 (`immofacile`)
- **Review pages written: 87**

## Pages written (content/reviews/*.md)

100k-funding-challenge-free, acceleratoruniversity, african-network-5065, ai-agency-incubator-5149, ai-automation-academy-3955, ai-automation-mastery-group, ai-developer-accelerator, ai-mit-arnie-gratis, ai-store-builder, aiagent8, alpha-ofm-5441, anti-procrastinacion, aware-builders-club-4195, brand-with-sina, cashflow-freedom-1778, chatgpt, closerworld, comunidad-el-regalo-de-ser-tu, content-academy, digital-dropshipping-academy-4647, dropship-mastery-7073, dsa, easy, ecom-viking, ecomliberty-8960, ekereskedelem, empresarios-digitales, escape-the-9-to-5, faceless-creators-4495, fire-gratis-6467, fitlifelab, freethe-creditprenuer-group-6106, fundamentos, generational-revival, genio-lector, gohighlevel, gopublish-start, gratis, groundcontrol, holistic-humans-free-5230, hustlegames, ia-mastery, imperio-digital-academy-9836, insurance-sales-success, international-hustlers-7809, jaafit, ki-agenten, ki-champions, kingdom-minds-3238, leadbase, liberty, make-1k-5k-in-30-days-8449, markgrowth-pro-8463, media-buying-academy, medical-courier-group-5674, microsoft-fabric, mlagency-9853, monaport-interiordesign, offerlabsecrets, online-ticaret-universitesi-2309, online-wealth-academy-home, osx-free, phone-flipping-academy, pipmunch, plant-enthusiast-6960, pmp, projectbiohacked, scaleyourcoaching, skate, social-creator-club-lite-5697, software, software-developer-academy-5620, somaticrelease, team-ruff-8631, tetris-trading-6725, the-ai-automation-circle, the-escapetheory, the-founders-club, the-manifestation-tribe-8744, top-chess-gang-7947, ucionica-buducnosti, unikazan-yks-yardmlasma-grubu-4593, unison-producer-growth-hub, universidadonline, upwork-outbound-free-9857, women-helping-women-mastermind-9715, zero-one

All 87 files verified programmatically after writing:
- frontmatter `word_count` matches actual body word count (2 files were slightly under 400 words and were expanded to fit the 400-650 target; 1 file had an off-by-one count fixed)
- body word count falls within 400-650
- zero occurrences of the em dash character (—) anywhere in title, meta_description, or body
- mandatory CTA line present in the exact required form linking to `https://trustskool.com/community/{slug}`
- all six required sections present (What's Actually Inside, Who Runs It, Pros, Cons, Who It's a Good Fit For, Who Should Skip It)
- no slug collisions with the existing 3,116 covered communities

## Skipped: too generic (rule 2) — 13 total

Pre-filtered before writing (description gave no specific topic/niche, only generic self-help/hype language):

1. `waysuccess` (109,041 members) — "learn how to reach your best version and achieve the life you want", no specific topic
2. `day-by-day-family-4722` (61,136 members) — "journey to becoming their best self", generic wellness language only
3. `wealth-academy-6133` (34,599 members) — description is just "Online Business Mastery", no specifics
4. `peach-club` (30,671 members) — purely generic social-club language ("Peach Perfect"), no topic
5. `bigbusinessentrepreneurs` (21,564 members) — "exclusive support network... empower entrepreneurs", no method or niche named
6. `moneylab-1-club-2324` (21,267 members) — generic hype ("welcome to the 1%"), no specific topic or method
7. `moddahobbykits` (17,069 members) — never specifies which hobby, too vague to review
8. `thenewrich` (13,060 members) — generic wealth-motivation metaphor, no concrete method or niche
9. `biohackingheroes` (11,536 members) — despite the slug, description is generic self-help hype with no actual biohacking/health content described
10. `dreldemellawy` (11,018 members) — description is just "Live and grow with Dr.Eldemellawy", no topic
11. `slavica-squire-free` (9,741 members) — generic self-help/inspirational language, no specific topic
12. `this-is-it-team-4127` (9,183 members) — generic entrepreneurship hype, no specific method or niche

Caught by the writing agent on closer read:

13. `immofacile` (11,222 members) — description is a bare welcome greeting ("Bienvenue dans la communauté Skool d'Immofacile 🚀") with no actual content beyond the name itself

## Process notes

- No external research (WebFetch/WebSearch) was used anywhere in this run. Every claim in every review comes only from the fields in `data/communities.json` (description, display_name, owner_name, price fields, total_members, language). No founder biography was invented for any community; where `owner_name` was present it was stated plainly with a note that no further background is available, matching the existing site's pattern for unverified owners.
- 88 communities were sent to the writing step (100 candidates minus 12 pre-filtered); 87 were ultimately written after the writing agent skipped 1 more (`immofacile`) for being too vague.
- Work was split across 10 parallel batches of ~9 communities each; each batch was independently instructed on tone, rules, and format, then the full output was re-verified programmatically against every non-negotiable rule (word count, em dash, CTA format, required sections, no duplicate slugs).
