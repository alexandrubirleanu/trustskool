# Skool News blog routine — 2026-09-11

## Important: an open PR from a previous run already covers most of the backlog

Before finalizing this run, a check of open PRs surfaced **PR #11 — "[Routine] Skool News blog 2026-09-05 — 5 articoli"** (`routine/skool-news-2026-09-05`, still open/unmerged as of this run). That PR already adds articles for episodes **#66, #67, #69, #71, #72**, and its own log explicitly documents that it could not resolve URLs for **#68** or **#70** and left both out.

This run initially (before catching the overlap) independently rediscovered and drafted articles for #66, #67, #69, #71, and #72 as well, via the same WebSearch-based discovery method. **Those 5 duplicate drafts were discarded** before committing, to avoid shipping a second, redundant PR for content already pending review in PR #11. Nothing from this run touches those 5 episodes.

The one genuine finding beyond PR #11: **this run was able to resolve a title and video URL for episode #70 ("Skool Goes Global")**, which the prior run could not find at all. That is the only new content shipped in this PR.

## Access constraint (same as the prior run)

The network egress policy for this session blocks direct `WebFetch`/HTTP access to `youtube.com`, `skool.com`, and every other general third-party domain tried (confirmed via a control fetch to `example.com`, also blocked). The RSS feed and `/videos` tab approach specified in the routine's steps could not be used at all. Discovery was done entirely via the `WebSearch` tool (channel ID `UCWUO7B2bVefoae-ruV4g3XQ`, resolved via search), searching episode-by-episode (`"Skool News #66"`, `"Skool News #67"`, ...). This is the same constraint and workaround the 2026-09-05 run hit and documented — flagging again in case a future run has working direct access and can re-verify everything via the actual RSS feed.

## Episode #70 — what was found and what wasn't

- **Title/URL**: "Skool Goes Global | Skool News #70" — `https://www.youtube.com/watch?v=e4nV78zE7ho`. Found via `site:youtube.com` search after several plain-query attempts failed to surface it (consistent with why the 2026-09-05 run missed it entirely).
- **Real content**: despite multiple targeted searches ("Skool Goes Global" + languages/currencies/countries, summary/recap queries), no transcript- or description-level detail could be found beyond the title and its position in the international-expansion arc that started with episode #68 ("Languages Are Here!" — Spanish/German support, confirmed in the 2026-09-05 log too).
- Per the routine's rule against inventing content from a title alone, the article for #70 is written narrowly around what's actually confirmed (the title, its place after #68, and #68's confirmed Spanish/German launch) and **explicitly tells the reader** that this recap could not verify #70's specific content — it does not present guessed specifics as fact.

## Episode #68 — still unresolved, still skipped

Consistent with the 2026-09-05 run, episode #68 ("Languages Are Here!", ~2026-08-04, Spanish/German + auto-detect) could not be resolved to a `youtube.com/watch?v=...` URL through any search phrasing tried this run either. Not added to `processed_videos.json`, no article written. Should be picked up automatically whenever it can be resolved (ideally once direct YouTube/RSS access is available).

## Episodes #73+

Searched for #73, #74, #75 — no results found. #72 remains the latest confirmed episode as of this run.

## Files created / changed

- `content/skool-news/skool-goes-global-international-expansion-skool-news-70.md` (437 words) — the only new article this run.
- `content/skool-news/processed_videos.json` updated: 40 → 41 URLs (only `e4nV78zE7ho` added; the 5 URLs already covered by open PR #11 were deliberately **not** added here, since this branch doesn't include those articles — they'll be added by PR #11 when it merges).

## Self-verification results

- [x] `processed_videos.json` parses as valid JSON, sorted, deduplicated (verified with `json.load`)
- [x] The new article's YAML frontmatter parses (verified with `yaml.safe_load`)
- [x] The new article contains both required closing links (`[Watch the original video]` and `[See how TrustSkool tracks Skool communities by real growth data](https://trustskool.com)`)
- [x] The new article's slug does not collide with any existing file in `content/skool-news/`, including the 5 pending in open PR #11
- [x] Counts above are real: 1 new video processed (#70), 1 still unresolved and skipped (#68), 5 correctly recognized as already covered by open PR #11 and excluded from this PR to avoid duplication
