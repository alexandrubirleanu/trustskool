# Skool News blog routine — 2026-08-01

## Access notes

Direct access to youtube.com was unavailable this run:

- The channel page (`https://www.youtube.com/@skool-news`) and the RSS feed
  (`https://www.youtube.com/feeds/videos.xml?channel_id=UCWUO7B2bVefoae-ruV4g3XQ`)
  both returned **HTTP 403** via the WebFetch tool (YouTube-side bot/anti-scraping
  block, consistent across every youtube.com URL tried, including a single
  video watch page and the channel's public playlist).
- Direct `curl` access from the sandbox is also blocked by the session's
  outbound network policy for youtube.com (confirmed via the agent-proxy
  status endpoint).
- As a fallback, video discovery was done via web search against the
  `@skool-news` channel (channel ID `UCWUO7B2bVefoae-ruV4g3XQ`, resolved via
  search), matching the "Skool News #N" title pattern and cross-checking
  against `processed_videos.json`.

This means the "up to 40 latest videos" step could not be done via RSS/tab
listing as specified; coverage is best-effort based on what search indexed.
**No episode numbering above #67 turned up in repeated searches**, so #67 is
treated as the latest available episode as of this run. A future run with
working YouTube access should re-verify there isn't a gap.

## Videos found (new vs. already processed)

- Episode **#66** — "Free Trial + Freemium Improvements | Skool News #66"
  (`https://www.youtube.com/watch?v=WoPcIfAYLyQ`) — **new**, not in
  `processed_videos.json`.
- Episode **#67** — "Growth Boost is Boosting | Skool News #67"
  (`https://www.youtube.com/watch?v=TK_UY-vJD6Y`) — **new**, not in
  `processed_videos.json`.

All other episodes surfaced by search (e.g. #60–#65, #39, #55, #36, #62)
were already present in `processed_videos.json` and were skipped.

## Processing results

- **#66 — real content found, article written.** Web search surfaced actual
  chapter markers from the video's own description ("Intro", then "New
  features: Free trial locked content + freemium upgrade button + close
  door..."), giving three concrete, real feature names to write about. Article
  created: `content/skool-news/skool-free-trial-freemium-improvements-close-door-upgrade-button.md`
  (572 words). The article includes an explicit note that only chapter
  markers/title were available, not a full transcript, and that exact rollout
  details were not independently verified beyond what Skool News published.
  Added to `processed_videos.json`.
- **#67 — no real transcript or description retrievable, article NOT
  written.** Multiple targeted searches (chapters, timestamps, recap posts,
  fan write-ups) returned only the title "Growth Boost is Boosting" with no
  episode-specific description, chapters, or transcript. Per the no-invention
  rule, no article was written for this video. **It has intentionally been
  left OUT of `processed_videos.json`** so a future run (ideally with working
  YouTube/transcript access) can pick it up and write it properly instead of
  it being silently skipped forever.

Real-content vs. title-only breakdown: **1 of 2** new videos had retrievable
real content (#66); **1 of 2** (#67) was title-only and skipped.

## Files changed

- `content/skool-news/skool-free-trial-freemium-improvements-close-door-upgrade-button.md` (new article)
- `content/skool-news/processed_videos.json` (added #66's URL only)
- `logs/skool-news-routine-2026-08-01.md` (this file)

## Self-verification

- [x] `processed_videos.json` parses as valid JSON
- [x] The new article has parsable YAML frontmatter (title, meta_description,
      source_video_url, source_video_title, published_date, word_count)
- [x] The new article has both required closing links
- [x] No duplicate slug vs. existing files in `content/skool-news/`
- [x] Counts above reflect what actually happened this run
