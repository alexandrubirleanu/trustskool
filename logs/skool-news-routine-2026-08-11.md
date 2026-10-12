# Skool News blog routine — 2026-08-11

## Discovery method

Direct access to youtube.com (both the channel page and the `/feeds/videos.xml` RSS
endpoint) is blocked by this environment's network egress proxy
(`EGRESS_BLOCKED` on `www.youtube.com`), so the channel's RSS feed could not be
fetched as the primary source per the routine's instructions. Fell back to
WebSearch to identify the channel (`@skool-news`, channel ID
`UCWUO7B2bVefoae-ruV4g3XQ`) and enumerate its most recent uploads by searching
episode numbers (`#56`–`#70`) against the existing `processed_video_urls`
backlog, which already covered episodes through #65.

## Videos found vs. new

- Newest episodes located via search: **#66** ("Free Trial + Freemium
  Improvements") and **#67** ("Growth Boost is Boosting"). No episode #68 or
  later was found in multiple targeted searches, so #67 is treated as the
  current latest upload as of this run.
- Both #66 and #67 were **not** present in `processed_videos.json` → 2 new
  videos processed this run.
- All other episodes turned up by search (#57–#65) were already present in
  `processed_videos.json` and were skipped.

## Transcript / description sourcing

Full transcripts were not retrievable (no direct page access to the video, no
third-party transcript site surfaced for either video). Content is based on
real, search-confirmed material rather than the title alone, but should be
treated as **partial-source, not full-transcript**:

- **#66 — Free Trial + Freemium Improvements** (partial source: real
  video chapter list surfaced via search — "0:00 Intro", "0:15 New features:
  Free trial locked content + freemium upgrade button + close door" — plus
  Skool Help Center context on free trials and freemium plans). Article
  describes the three named features at a conceptual level; no invented
  specifics (numbers, quotes) beyond what the chapters name.
- **#67 — Growth Boost is Boosting** (partial source: two real video chapter
  headers — "Growth boost is starting to rip! Lots of success stories..." and
  "Efficient groups are ge[tting]..." — plus a search-engine-surfaced summary
  citing "30%+ of members from Skool Discovery" and hobby-niche examples
  (ukulele, machine knitting)). These specific figures/examples come from a
  search result summarizing the video's own content, not from Claude's own
  viewing of the video — flagging this as the weakest-sourced article of the
  two in case those specifics need independent verification before wider
  distribution.

**0 of 2** articles are based on a full verbatim transcript. **2 of 2** are
based on partial real source material (chapters/description, not invented
from title alone).

## Publish dates

Exact publish timestamps were not directly accessible. Dates were estimated
from "N weeks ago" relative search snippets (captured 2026-08-11) combined
with the channel's established weekly cadence (confirmed exact dates for
episodes #57–#64 running May 19 → July 7, 2026 weekly): #66 ≈ 2026-07-21, #67
≈ 2026-07-28. These are best-effort estimates, not scraped exact dates.

## Files created

- `content/skool-news/skool-free-trial-freemium-close-door-features-explained.md` (507 words)
- `content/skool-news/skool-growth-boost-efficient-groups-success-stories.md` (475 words)
- `content/skool-news/processed_videos.json` updated: added
  `https://www.youtube.com/watch?v=WoPcIfAYLyQ` and
  `https://www.youtube.com/watch?v=TK_UY-vJD6Y` (42 total, deduplicated,
  sorted).

## Self-verification

- [x] `processed_videos.json` parses as valid JSON (checked with `python3 -m json`), no duplicates, sorted.
- [x] Both articles have parsable YAML frontmatter (checked with PyYAML).
- [x] Both articles contain both required closing links (`Watch the original video` + `trustskool.com` link).
- [x] No slug in this run duplicates an existing file in `content/skool-news/`.
- [x] Counts above reflect the actual search results and file diffs from this run.
