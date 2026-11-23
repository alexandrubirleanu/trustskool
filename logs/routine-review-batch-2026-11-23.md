# Routine run: New community reviews (2026-11-23)

## Summary

- Communities in dataset: 32,221 (same count as last week's run; the dataset may not have been refreshed)
- Already covered (main frontmatter in content/founders + content/reviews): 3,203
- Also excluded: 582 slugs already written in earlier unmerged routine branches (routine/community-reviews-2026-07-27 ... 2026-11-16, PRs #13 to #26 still open), so no page is duplicated
- Also excluded: 69 slugs already skipped as too generic in earlier routine logs
- Candidates after filtering (description >= 20 chars, members >= 50): 12,184
- Selected (top 100 by members, 2,214 down to 1,818 members): 100
- Skipped as too generic / private / inactive: 38 (35 at pre-filter, 3 by writers on closer read)
- **Review pages written: 62**

## Pages written
360-profit, academie-gratuite-fit-et-flex-7583, ai-first-client-formula-8589, ai-komunita, aiempire, akademia-100k-7213, algora-finance-free-5331, altather, amigoscode, aneuf-3789, barber-launch-8407, beauty-growth, become-unforgettable, becoming-more-me-community, bowhunting, cashflowquartier, conduongbotngu, creditprenuer, delta-trading, desconheco-1709, dropshipping-desde-cero-9714, ecomprender-producto-rentable-9821, ethical-publishers, etsy-success-membership, fbacademie-2339, free-yajoura-community-4303, glow-boss-academy-3706, googleads, group-home-riches-6526, gymlaunch, ideas-to-income-8492, jakobsweg-lebensweg, lbo, legal-funnel-community-2357, leverage-credit-for-cashflow-4941, liliinvests, lmc, longevity-kitchen, loqode, makerschool, meilenweitvoraus, mental-reprogramming-community-7274, metodologia-viral, monetizaacademy, polina-batee-9340, promptfluence-4478, quins-inner-circle-lite-7917, rewildbreathwork, robertbilling, scalers, search-ai-academy, selling-with-confidence-8958, strength, sunday-study-club-3178, the-boxing-community-2425, the-coaching-hub, the-script-9741, thelcbiologyguy, trucking-success-route-free-8221, wspolnyfront, zero-to-pitch, zonefree-6414

All 62 verified programmatically: word_count matches body (len(body.split())), body 400-650 words, no em dash or en dash anywhere, CTA present in the exact form, all six sections present, slug matches filename.

## Notes for review

- **CTA and trailing spaces:** three display names in the dataset end with a space (`glow-boss-academy-3706`, `beauty-growth`, `creditprenuer`). The CTA uses the trimmed name so it reads "...Community's", not "...Community 's". Worth trimming display_name in the scraper.
- **Pricing ambiguity:** `makerschool` has an empty price field but the description says $184/mo. The page has a short Pricing section explaining the mismatch, with no invented price. Paid per the data: `altather` ($99/mo), `etsy-success-membership` ($27/mo), `creditprenuer` ($50), `lmc` ($50/mo), `meilenweitvoraus` ($459/yr), `wspolnyfront` ($12/mo), `strength` ($34/mo).
- **Language mismatches:** `free-yajoura-community-4303` (data says Arabic, description is English), `sunday-study-club-3178` (Danish + English), `conduongbotngu` (English name, Vietnamese description). In `conduongbotngu` a writer's guessed translation of the slug was removed.
- **Very thin descriptions kept** because the topic is clear: `trucking-success-route-free-8221`, `promptfluence-4478`, `lbo`, `googleads`, `polina-batee-9340`, `legal-funnel-community-2357`, `longevity-kitchen`, `thelcbiologyguy`, `group-home-riches-6526`. Drop them if you want a stricter rule 2.
- **Unverified claims:** income/results claims (e.g. "€1.5M+ royalties", "lose up to 5 kg in 30 days", "$10,000/month", "first client in 90 days or your money back", credit/funding promises) are attributed to the community's own description. No owner bios were written. Where owner_name looks like a brand or handle, the page says so.
- `lmc` and `thelcbiologyguy` include one or two sentences of general topic background (synthetic indices, Irish Leaving Certificate), not claims about the community.

## Skipped (rule 2: too generic / private / inactive)

Pre-filter:
- `theneighborhood`: "A unified people creating Heaven on earth.", no topic
- `starter-locatif`: "Développez un patrimoine d'envergure", one slogan, no method
- `brutalrx`: "Información cruda para quienes ejecutan.", no topic
- `conscious`: "Be Yourself. Make Money."
- `phix-your-life-9885`: "Just Add Your Team And Grow!"
- `itlc`: "all personality types welcome", no topic
- `lifechangers-builder-hub-1272`: "MONEY is ENERGY", no topic
- `holistic-health-community`: "Transform your health holistically.", nothing more
- `itgirlacademy`: "Become the girl you've always dreamed of being", no topic
- `ktips-academy-6036`: "Join the team. Train to WIN", no topic
- `themomentumacademy`: generic progress slogan
- `the-roadmap-rebellion-6758`: generic "honesty and transformation" language
- `conscious-warrior-community`: emoji slogans only (consciousness, energy, inner peace)
- `academy-six-dm-4795`: "high-income skills and A.I.", no method or niche
- `empowered-connections-4729`: generic networking/resources language
- `elite-1-freelancing-network-8367`: audience only, nothing on what is taught
- `propulser-7062`: generic "live your custom life" language
- `lecole-des-freelances-3433`: private space for existing program clients only
- `cercleimmobilier`: members-only space for an existing program
- `eecfbablitz`: private group for an existing Amazon FBA program
- `embroidery-legacy`: support space for owners of a software product, customer-only
- `be-the-light-be-fit`: "transform your business while impacting lives", no topic
- `faceless-instagram-5923`: "connect & build brands together", nothing specific
- `wealthymind`: generic wealth-mindset language (Arabic)
- `leadfluence-academy`: closed, redirects to another community
- `ai-ip-2018`: one philosophical line on personal IP (Chinese), no content described
- `justbank`: "future of content and social selling", no detail
- `gesundheitscommunitytfa-7220`: generic "balance yourself" health slogan
- `kahi-family`: "a place of the heart", no topic
- `derma-habits-3404`: generic holistic self-healing line, no topic
- `remote-income-solutions-9659`: generic remote-earning language
- `ai-to-100k`: "Learn AI with Brittany Long", too broad
- `free-systemkit-6100`: audience and revenue target only, no method
- `thewomanschool`: generic mindset/wholeness language
- `digital-property-boss-academy-2236`: hype only, "digital property" never defined

Caught by writers:
- `stock-accelerator-3988`: hype line ("Minutes-to-Money strategy") only
- `bolsa-de-trabajo-growing`: a five-word slogan, nothing to review
- `smartmoneyonlyus`: "master the markets from zero", no asset class or method

## Process notes

- No external research was used. Every claim comes only from data/communities.json fields.
- The work was split across 7 parallel writer agents, then re-verified centrally with the same checker.
- Note: 14 earlier routine review PRs (#13 to #26) are still open and unmerged.
