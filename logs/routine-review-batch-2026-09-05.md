# Routine review batch - 2026-09-05

## Summary

- Candidates considered: top 100 communities by `total_members`, after filtering the dataset for `description` length >= 20 chars and `total_members` >= 50, and excluding slugs already covered.
- Pages written: 88
- Skipped (too generic, rule 2): 12
- Branch: `routine/community-reviews-2026-09-05`

## Methodology

1. Cloned repo, checked out `main`, pulled latest.
2. Read `data/communities.json` (32,221 communities).
3. Built the "already covered" slug set from frontmatter (`slug` / `community_slug`) across every file in `content/founders/*.md` and `content/reviews/*.md` on `main` (3,203 slugs).
4. **Deviation from the literal instructions, noted explicitly:** also excluded the 85 unique slugs already drafted (as real, finished review pages) across the five still-open `routine/community-reviews-2026-07-27` through `-08-24` branches. See "Important: recurring blocker" below for why those pages exist but never reached `main`. Writing today's top-100 pull without this exclusion would have reproduced most of the same ~85 communities a sixth time, since `main`'s coverage has been frozen since the 2026-07-20 merge and every subsequent weekly run was, by design, only diffing against `main`.
5. Filtered the dataset (description >= 20 chars, members >= 50, not already covered by the union above), sorted by `total_members` descending, took the top 100.
6. Read 3 existing files in `content/reviews/` to match tone/frontmatter/format.
7. Applied rule 2 (skip if too generic) to the top 100 by hand before drafting; 12 were skipped (list below), 88 were written.
8. Split the 88 into 9 batches of ~10 and generated pages via parallel writer agents, each applying the same non-negotiable rules from the 2026-07-19 launch batch (no invented bios, skip pure-filler descriptions, honest pricing, no em dashes, mandatory CTA, 400-650 word target matching frontmatter `word_count`).
9. Verified all written files: zero em dashes, correct CTA line format on every file, frontmatter `word_count` matching actual body word count.

## Skipped communities (too generic, rule 2)

| Slug | Display name | Members | Reason |
|---|---|---|---|
| `waysuccess` | Comunidad WaySuccess | 109041 | descrizione generica, nessun tema/nicchia specifico ("reach your best version, life you want") |
| `peach-club` | PEACH CLUB | 30671 | descrizione generica, nessun tema/nicchia identificabile oltre al branding |
| `biohackingheroes` | Main Character Society ⚜️ | 11544 | descrizione e display_name generici ("main character", "look the part"), nessuna nicchia concreta nonostante lo slug suggerisca biohacking |
| `dreldemellawy` | عش مع د. أحمد الدملاوي | 11019 | descrizione generica ("live and grow with X"), nessuna nicchia o argomento specifico |
| `slavica-squire-free` | Slavica Squire (Free) | 9741 | descrizione generica sul diventare la miglior versione di se stessi, nessun tema concreto |
| `ecomreal` | Money Switch by ECOM REAL | 6660 | descrizione placeholder ("Pronto algo grande" / "coming soon"), nessun contenuto reale da recensire |
| `minesetarmy` | MineSet Army | 5848 | descrizione di due parole ("Follow the Protocol"), nessuna informazione utilizzabile |
| `perfect-pop-up-challenge-5033` | Hydro Mind Accelerator | 5835 | descrizione generica ("shortcut the learning curve"), nessun tema/nicchia specifico |
| `the-one-percent` | The One Percent | 5431 | descrizione generica ("dove i desideri diventano realta"), nessun tema concreto |
| `creadoresdeprosperidad` | Creadores de Prosperidad | 5196 | descrizione generica sull'abbondanza, nessun tema/metodo specifico |
| `tiktok-1203` | Evolution Creator Membership | 5219 | descrizione riguarda solo la verifica dell'acquisto membership, nessun contenuto sulla community |
| `fjp-skills-training-institute-7168` | RISE Skills Academy | 5521 | descrizione generica ("Build Skills. Create Income. Change Your Future."), nessuna skill o nicchia nominata |

## Pages written

Sorted by `total_members` descending, slug, display_name, members:

| Members | Slug | Display name | Word count |
|---|---|---|---|
| 61131 | `day-by-day-family-4722` | Day by Day Wellness Club | 402 |
| 21267 | `moneylab-1-club-2324` | MoneyLab 1% Club | 453 |
| 13071 | `thenewrich` | The New Rich | 431 |
| 9196 | `this-is-it-team-4127` | This Is It Team Training | 403 |
| 8962 | `co-creators` | Co-Creators | 425 |
| 8571 | `gem-grow-earn-multiply-1261` | GEM 2.0 | 431 |
| 8074 | `lindependance-digitale-6163` | L'indépendance Digitale | 429 |
| 7273 | `bsg-4603` | The Built Different Community | 419 |
| 7101 | `minzero` | Min Zero | 417 |
| 6374 | `americanleverage` | American Leverage™ | 434 |
| 6354 | `ai-by-aagii-4835` | AI BY AAGII | 428 |
| 6352 | `digital-origin-community-6831` | Digital Origin Community | 446 |
| 6341 | `actiontaker` | Fulltime Freedom | 449 |
| 6340 | `dwa-mrr-6424` | DWA MRR | 444 |
| 6275 | `millionairesinmedicine` | Millionaires in Medicine Club | 433 |
| 6248 | `ecommastery-4502` | EcomMastery | 412 |
| 6233 | `ai-creators-club-1501` | AI Creators Club | 400 |
| 6230 | `aminos` | Aminos Community | 406 |
| 6201 | `fucketlist-free` | Fucketlist Life | 429 |
| 6137 | `amsernest-1393` | Becoming Global Citizens | 429 |
| 6110 | `faceless-youtube-foundation` | Faceless Youtube Foundation | 509 |
| 6101 | `viegas-academy-free-2786` | Viegas Academy FREE | 464 |
| 6064 | `manifiestatuabundancia` | ¡Manifiesta tu Abundancia! ✨ | 448 |
| 6040 | `kingdom-crown-9402` | Kingdom Crown | 428 |
| 6029 | `ai-squadx-3019` | AI SquadX | 448 |
| 6015 | `turkiye` | Skool Türkiye (Ücretsiz) | 415 |
| 5957 | `sniper-nation-8512` | Sniper Nation | 409 |
| 5935 | `etaxadvisors-club-8268` | eTaxAdvisors 🤠👍 | 445 |
| 5921 | `the-academy-5757` | Agency Scaling Group | 439 |
| 5898 | `digital-success-mastery-3781` | Digital Success Mastery | 403 |
| 5862 | `postgraduate-academy-7355` | PostGraduate Academy | 508 |
| 5838 | `stockhacker` | 炒股黑客 | 463 |
| 5775 | `createfacelesswealth` | Create Faceless Wealth | 484 |
| 5762 | `upwebinar` | Webinar Masters | 424 |
| 5762 | `faceless-wealth-guide-8689` | Faceless Wealth Guide | 482 |
| 5757 | `learn-pro-poker` | LearnProPoker: FREE | 442 |
| 5701 | `optimize` | OPTIMIZE & THRIVE | 483 |
| 5657 | `realestateinvesting` | Real Estate Investing | 464 |
| 5645 | `creator-party` | Creator Party | 451 |
| 5643 | `communaute-adp-1284` | 🌞 Communauté ADP 🌞 | 492 |
| 5587 | `tentmakers` | Tentmakers | 475 |
| 5550 | `theskoolhub` | THE SKOOL HUB | 460 |
| 5547 | `freedom-empire` | Freedom Empire by Maggie Giele | 467 |
| 5498 | `blazecamp` | SON HABITOS - Nati Vera | 455 |
| 5490 | `mastermannation` | Masterman Nation | 423 |
| 5472 | `zero2launch-ai-automation-5951` | Zero2Launch AI Automation | 415 |
| 5446 | `tax-pros` | Tax Resolution Pros | 400 |
| 5444 | `university-of-code-9701` | University of Code | 410 |
| 5435 | `limitless-training` | Limitless Training | 419 |
| 5427 | `god-ares-ai-academy` | God Ares AI Academy | 410 |
| 5398 | `skool-scale-camp` | Skool Scale Camp | 481 |
| 5378 | `orca-ai-studio-2442` | Orca AI Studio | 442 |
| 5364 | `auto-locksmith-masterclass` | Auto Locksmith Elite (Free) | 444 |
| 5355 | `strategic-fba` | Digital Brand Builders | 452 |
| 5317 | `100-days-of-writing-5075` | مئة يوم من الكتابة | 433 |
| 5317 | `ecom` | Ecom | 436 |
| 5296 | `loja-pronta-gringa` | Loja Vencedora | 451 |
| 5283 | `coaching-business-launch` | Coaching Business Launch | 445 |
| 5276 | `the-mental-gym-6903` | Meditation Circle by 4minds | 415 |
| 5255 | `ivy-league-free-course-2195` | Ivy League Free Course | 404 |
| 5251 | `true-marketer-4927` | True Marketer | 477 |
| 5239 | `wahjobqueen` | WAH Vault w/WAHJobQueen™ | 495 |
| 5236 | `threads-to-millions-community-1202` | Threads to Millions ™ | 452 |
| 5211 | `manifestation-booster-8711` | MANIFESTATION LAB 🔥 | 437 |
| 5205 | `germanskoolers` | Skool Community (deutsch) | 443 |
| 5198 | `granthouse` | GrantHouse | 468 |
| 5191 | `latina-money-academy-1529` | Latina Money Academy | 493 |
| 5182 | `rise-and-rewire-4309` | Rise and Rewire | 459 |
| 5176 | `tongue-of-fire` | Tongue of Fire Ministry | 450 |
| 5167 | `faceforward-ai-9538` | FACEFORWARD AI® | 469 |
| 5156 | `aicontentcommunity` | AI Content Creation Community | 447 |
| 5147 | `beginner` | The Public Speaking Community🔥 | 429 |
| 5142 | `credit-club-3360` | Credit Club | 409 |
| 5140 | `automation-hub-4456` | AI Automation Network | 429 |
| 5139 | `business-synergy-sisterhood-3231` | Business Synergy Sisterhood | 411 |
| 5139 | `lesshustle` | Less Hustle Tribe | 414 |
| 5121 | `10x-youtube` | 10x Youtube | 444 |
| 5105 | `airbnb` | Airbnb Startup University | 466 |
| 5099 | `google-ads-skool` | Google Ads Skool | 457 |
| 5096 | `amazon-fba-ai-systems-7939` | AI SAAS Builders (Workshops) | 460 |
| 5090 | `7daychallenge` | 7 Day AI Challenge | 426 |
| 5076 | `aiexpertsclub` | AI Experts Club | 433 |
| 5065 | `valladares-real-estate-network` | (Closing) Valladares Network | 413 |
| 5061 | `freelancer-masterclass` | Agentur Community (DACH) | 400 |
| 5058 | `cambiate-a-remoto-2695` | Cambiate a Remoto [CAR] | 424 |
| 5031 | `pro-gig-academy` | Pro Gig Academy | 435 |
| 4991 | `ascension20` | Ascension 20 | 407 |
| 4977 | `grow` | AchieveGreatness Skool Growth | 425 |

## IMPORTANT: recurring PR-creation blocker (5+ weeks running): needs org-admin action

This run hit the exact same wall documented in every weekly run since 2026-08-03:

> GitHub API access (both the `gh` CLI and direct REST calls) returns:
> `GitHub access is not enabled for this session. An org admin must connect the Claude GitHub App for this organization.`

This is an org-level authorization gate, not a retryable/session-specific error. `git push` works fine (branches land on `origin`), but the routine cannot open the pull request itself.

**Branch pushed:** `routine/community-reviews-2026-09-05`
**Manual PR link:** https://github.com/alexandrubirleanu/trustskool/pull/new/routine/community-reviews-2026-09-05

## IMPORTANT: the 5 backlogged branches almost entirely duplicate each other: recommend cleanup, not sequential merge

While investigating the blocker, I checked the state of every unmerged `routine/community-reviews-*` branch still sitting on `origin` (07-27, 08-03, 08-10, 08-17, 08-24: none merged, and none has an actual GitHub PR open despite branch names implying one; `refs/pull/*/head` on the remote shows PR numbers 1-10 exist for other work, but none of them point at these 5 branches, meaning **no pull request was ever successfully created for any of these 5 weekly batches**, only the earlier `08-03` run left a note about the blocker in its own log).

Because every one of those runs only ever diffed against `main` (which has not changed since the 2026-07-20 merge), each week's "new" top-N pull kept re-discovering essentially the same communities:

| Branch | Files | 
|---|---|
| routine/community-reviews-2026-07-27 | 68 |
| routine/community-reviews-2026-08-03 | 84 |
| routine/community-reviews-2026-08-10 | 77 |
| routine/community-reviews-2026-08-17 | 59 |
| routine/community-reviews-2026-08-24 | 64 |
| **Union of unique slugs across all 5** | **85** |

In other words, ~352 files were written across 5 weeks but they cover only 85 distinct communities: almost total overlap, not incremental coverage. These branches cannot simply be merged one after another (most would conflict on identical filenames with different content for the same slug).

**Recommended action for the human:**
1. Connect the Claude GitHub App for this GitHub org so future runs can open PRs automatically (this alone would have prevented the backlog from forming).
2. Pick ONE of the 5 backlogged branches to review and merge (2026-08-24 is likely the best pick: most recent member-count data), then delete the other 4 stale branches rather than trying to merge all of them.
3. Today's branch (`routine/community-reviews-2026-09-05`) was built to avoid re-covering those same 85 communities a sixth time, so it's safe to merge independently of whichever of the 5 old branches you keep.
