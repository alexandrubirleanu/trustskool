# Routine run: New community reviews (2026-11-16)

## Summary

- Communities in dataset: 32,221
- Already covered (main frontmatter in content/founders + content/reviews): 3,203
- Also excluded: 506 slugs already present in earlier unmerged routine branches (routine/community-reviews-2026-07-27 ... 2026-11-09, PRs still open), to avoid duplicate pages
- Also excluded: 105 slugs already skipped as too generic in earlier routine logs (so the top-100 window advances instead of re-evaluating the same communities every week)
- Candidates after filtering (description >= 20 chars, members >= 50): 12,285
- Selected (top 100 by members, 2,482 down to 2,214 members): 100
- Skipped as too generic / private: 24 (22 at pre-filter, 2 by writers on closer read)
- **Review pages written: 76**

## Pages written
3dprinting, affinity-photo-creatives-6824, ai-agent-society-4764, ai-automation-academy-7013, ai-automation-hub-5735, ai-avengers-3116, ai-genesis-8939, ai-money-protocol-9944, aicompass, aicreatorbootcamp, amplifi-research-meets-reward-1024, appointmentsetters, appointmentsetting, ay-adcademi-ai-1642, b2b-business-revolution, be-worthy-8265, bio-health-peptides-proteins-9123, brushandbanner, club-10k-launch, coach-g-1708, data-seo-8567, digital-money-plus-more-2705, digitalfreedommentorship, digitalmarketingblueprint, fitness-coaching-community, flow-unlock-6183, freedom-forge-free-8720, funnelhub, generadoparati-academy-3112, genesis-7011, happily-ever-authors-writers-8500, high-ticket-sales, highlevelvault, internet-money-central-9086, investingsection8, jayluxai-6642, keylearners, lawfreedom-8528, liberty-coach, manychatmasterclass-free, marys-fairyland-community-5964, minyona, monetise-ai-3283, must-hire-engineers, openclawlabs, osteofit, power, profitfy, prueba-de-cursoooo-6764, recodemand-webinar-mastery-1749, referrals-made-easy-4726, refreedom, restoringlovemarriage, roadman, sales-edge-6257, shan-wealth-8022, slinginginkskool, social-marketing, solidworks-accelerator, speedtoleaders, spidertech-6773, talkinghouses, tbc-3213, the-leading-club-2333, the-prime-seller-blueprint-6615, theway, thomas-skool-community-6132, vintage-mama-money-makers-6580, vital-generation, vitruvian-club-2990, vocal-activate-freeclub, vr-creator-academy-2358, wild-hunt-conditioning-group-5623, womens-peptide-collective-9663, youtube-okulu-4350, zaneteknits


All 76 verified programmatically: word_count matches body (len(body.split())), body 400-650 words, no em dash or en dash anywhere, CTA present in the exact form, all six sections present, slug matches filename.

## Notes for review

- `freedom-forge-free-8720`: listing says $1 USD/month while slug/name say free/Lite. The page flags the ambiguity and has an extra short "## Pricing" section on top of the six required ones.
- `speedtoleaders` ($79/month listed vs "Free platform access" in description) and `vocal-activate-freeclub` (800 cents with no currency/interval vs "Join For Free") are described as ambiguous pricing, not given an invented price.
- `roadman`, `ai-automation-hub-5735`, `manychatmasterclass-free`, `vital-generation`, `investingsection8`, `youtube-okulu-4350`, `ai-genesis-8939`, `zaneteknits`: very short descriptions with a clear topic; the pages state plainly how little the listing reveals. Drop them if you want a stricter rule 2.
- `ai-agent-society-4764`: dataset language is english but the description is Dutch; noted in the page.
- Income/results claims (e.g. $25M portfolio, $8M profit, "World Cup Winner", "34 closers earn 6 figures") are attributed to the community's own description as unverified. No owner bios were written; owner_name is only stated as the listed owner.

## Skipped (rule 2: too generic / private)

- `lidd` (2480 members): "ICH weiß wer ich BIN" (I know who I am), no topic or niche
- `digitalshift` (2473 members): "a simple, safe, and faith-driven corner of the digital world", never says what is taught
- `wolf-pack-6238` (2467 members): private group for active eXp Realty team members only, not a public offering
- `serving-humanity-community-8335` (2423 members): "help everyone get the documents they need", no indication which documents or topic
- `karrie-guzman-emprende-1896` (2379 members): "Aprende, crea y emprende desde casa", generic entrepreneurship slogan
- `nextgen-lite-1575` (2366 members): "Mission One Million", no topic
- `deutschland` (2340 members): "Community für Selbstständige", no topic beyond 'for the self-employed'
- `betosealfredos` (2327 members): motivational slogan only ("you can always be better") plus a support email
- `muzik-universitesi-8281` (2316 members): exclusive community for existing Müzik Üniversitesi students, customer-only space
- `ai-agency-launchpad` (2311 members): "Want to make money with AI? Start Here!", no method or offer described
- `gbagram-academie-4189` (2310 members): generic 'grow your business' language, no niche or method
- `magnadigitalacademy` (2310 members): "will help you step into the digital world", no topic
- `rapid-profit-machine-2687` (2302 members): generic '#1 digital marketing community' hype, no specific method
- `sales-io` (2281 members): "Sales as it should be.", no detail
- `be-awesome-9179` (2266 members): free content and discounts on the owner's programs, programs never named
- `chuyen-lam-chu-6507` (2239 members): generic self-mastery levels (health, energy, money, influence), no concrete topic
- `dreamteam-university` (2238 members): generic leadership/success language, no topic
- `trai-creator-9514` (2238 members): "turn your knowledge and passion into income", no method or niche
- `the-1-preview-6452` (2236 members): generic 'unlock your best' freebie funnel pointing to another community
- `makeonlinemoney` (2236 members): description is only "Ecommerce / Dropshipping Expert", too thin for an honest review
- `club-de-expansion-digital-7085` (2312 members): generic 'digital presence and online income' language
- `bizsister` (2287 members): audience named (creative entrepreneurs) but nothing about what the community does
- `iazos-6604` (2432 members): only says "join Felipe Borges' AiVerso community and get access to all class materials", topic never stated (caught by writer)
- `mustafa-dikmen-ile-yapay-zeka-1691` (2374 members): description only says "content from my YouTube channel and more" (caught by writer)

## Process notes

- No external research was used. Every claim comes only from data/communities.json fields.
- Work split across 7 parallel writer agents, then re-verified centrally with the same checker.
