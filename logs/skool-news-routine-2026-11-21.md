# Skool News routine — 2026-11-21

## Riepilogo
- Canale: @skool-news (channel_id UCWUO7B2bVefoae-ruV4g3XQ). RSS: 15 video; tab /videos: 30 video. Totale unico considerato: 30 (il canale non espone più di 30 nella tab senza scroll).
- Già in processed_video_urls: 10. **Nuovi: 20.**
- Articoli scritti: **19** — tutti da **transcript reale** (sottotitoli auto-generati YouTube scaricati via URL caption di yt-dlp, con retry per HTTP 429).
- Solo titolo / non processati: **1** — #69 "Reviews Are Here!" (https://www.youtube.com/watch?v=8NjPASpklh0): transcript sempre HTTP 429 dopo ~15 tentativi; disponibile solo la descrizione breve. **Nessun articolo scritto** (regola: no contenuto inventato). NON aggiunto a processed_videos.json, verrà ripreso alla prossima esecuzione.
- processed_videos.json: +19 URL (totale 59), dedup ok.

## Articoli creati (data video · titolo · file · parole)
- 2026-07-21 · Free Trial + Freemium Improvements | Skool News #66 · `content/skool-news/skool-free-trial-locked-content-freemium-upgrade-close-doors.md` · 698 — transcript reale
- 2026-07-28 · Growth Boost is Boosting | Skool News #67 · `content/skool-news/skool-growth-boost-wins-5000-day-ad-spend-efficiency-explained.md` · 691 — transcript reale
- 2026-08-04 · Languages Are Here! Spanish + German | Skool News #68 · `content/skool-news/skool-now-available-in-spanish-and-german-language-auto-detect.md` · 678 — transcript reale
- 2026-08-18 · Skool Goes Global | Skool News #70 · `content/skool-news/skool-global-fast-payouts-reviews-ab-test-chinese-italian-dutch.md` · 684 — transcript reale
- 2026-08-25 · Growth Boost Bidding System | Skool News #71 · `content/skool-news/skool-growth-boost-bid-slider-efficiency-four-stages-explained.md` · 688 — transcript reale
- 2026-09-01 · New Record: $1,000,000/month on Skool | Skool News #72 · `content/skool-news/skool-first-1-million-month-community-native-captions-platinum-interviews.md` · 693 — transcript reale
- 2026-09-03 · Nick Saraev: $280,000/month with an AI Automation Skool · `content/skool-news/nick-saraev-maker-school-280k-month-ai-automation-skool.md` · 700 — transcript reale
- 2026-09-08 · Growth Boost Masterclass | Skool News #73 · `content/skool-news/skool-growth-boost-reset-annual-plans-boost-stages-skool-news-73.md` · 691 — transcript reale
- 2026-09-11 · Ym Babie: $170,000/month with a Trading Skool · `content/skool-news/ym-babie-trading-bootcamp-170k-month-instagram-skool.md` · 680 — transcript reale
- 2026-09-15 · Growth Boost V2: We're Cooking! | Skool News #74 · `content/skool-news/skool-growth-boost-v2-variable-bidding-partnership-ads-skool-news-74.md` · 673 — transcript reale
- 2026-09-22 · Mission: End Creator Burnout | Skool News #75 · `content/skool-news/skool-mission-end-creator-burnout-roadmap-skool-news-75.md` · 681 — transcript reale
- 2026-09-29 · Skool Bus Tour Has Started | Skool News #76 · `content/skool-news/skool-growth-boost-levels-reviews-discovery-redesign-skool-news-76.md` · 691 — transcript reale
- 2026-10-06 · 200,000+ Ads Promoting You | Skool News #77 · `content/skool-news/skool-growth-boost-v2-200000-custom-ads-skool-news-77.md` · 673 — transcript reale
- 2026-10-13 · The 4 Levels of Growth Boost | Skool News #78 · `content/skool-news/skool-growth-boost-4-levels-requirements-explained.md` · 684 — transcript reale
- 2026-10-20 · Upload Your Ads, We'll Run Them | Skool News #79 · `content/skool-news/skool-custom-ad-uploads-growth-boost-levels-local-payments.md` · 708 — transcript reale
- 2026-10-27 · $250,000/month with TikTok Live | Skool News #80 · `content/skool-news/skool-upload-your-own-ads-tiktok-live-250k-month.md` · 677 — transcript reale
- 2026-11-03 · Introducing "Global Feed" | Skool News #81 · `content/skool-news/skool-global-feed-31-discovery-categories.md` · 672 — transcript reale
- 2026-11-10 · Introducing "Live Calls V2" | Skool News #82 · `content/skool-news/skool-live-calls-v2-launch-retention-algorithm-update.md` · 689 — transcript reale
- 2026-11-17 · Gibran's $450,000/month Launch | Skool News #83 · `content/skool-news/gibran-450k-month-skool-launch-tiktok-live-challenge.md` · 683 — transcript reale

## Note per la review
- La PR del branch `routine/skool-news-2026-08-01` (ancora aperta/non mergiata) contiene un articolo sullo stesso video #66 (WoPcIfAYLyQ) basato su ricerca web. Questa PR lo riscrive da transcript reale con slug diverso: conviene chiudere quella vecchia PR per evitare duplicati.
- I branch 2026-10-21 / 2026-11-01 contenevano solo log di blocco (nessun transcript): superati da questa esecuzione.
- Nomi propri poco chiari nei sottotitoli sono stati descritti genericamente invece che indovinati.
- Cifre discordanti tra titolo video e intervista sono riportate entrambe: Nick Saraev ($280K/mese nel titolo vs $3M/anno nell'intro); Ym Babie/Jade ($170K/mese nel titolo vs MRR attuale $155K dichiarato).
- #77 e #78 descrivono i livelli 3/4 di Growth Boost in modo diverso (la feature è cambiata tra le due settimane): ogni articolo riflette il proprio video.
- #75: "Pex"/"Wee Pay" nei sottotitoli interpretati come Pix e WeChat Pay.
- word_count = parole del corpo dopo il frontmatter (inclusi H1 e link finali); range 672–708.

## Self-verification
- [x] processed_videos.json valido (parse JSON ok)
- [x] ogni articolo ha frontmatter YAML parsabile (yaml.safe_load, tutti i 6 campi)
- [x] ogni articolo termina con i due link richiesti
- [x] nessuno slug duplica file esistenti in content/skool-news/
- [x] log con conteggi reali
