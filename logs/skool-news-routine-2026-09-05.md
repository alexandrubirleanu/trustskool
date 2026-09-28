# Skool News blog routine — 2026-09-05

## Environment constraint (important)

This session's network egress proxy blocks the `youtube.com` / `www.youtube.com` domains entirely
(`EGRESS_BLOCKED` / `connect_rejected (organization policy)` on both the WebFetch tool and raw
`curl` from Bash). This means:
- The channel page (`https://www.youtube.com/@skool-news`) could not be fetched directly.
- The RSS feed (`https://www.youtube.com/feeds/videos.xml?channel_id=...`) could not be fetched
  directly, neither with nor without `www.`.
- The `/videos` tab could not be fetched directly.

Discovery was done entirely via the WebSearch tool (which resolves server-side, outside this
sandbox's network policy), using targeted queries for episode numbers, titles, and video IDs.
This is a materially weaker discovery method than RSS/feed parsing: it can miss videos that don't
surface well in search snippets, and it cannot guarantee completeness. Flagging this so a human
reviewer knows the "up to 40 latest videos" step in the routine was not done via RSS as specified.

## Channel ID found

`UCWUO7B2bVefoae-ruV4g3XQ` (via WebSearch, confirmed against multiple `/watch?v=` and
`/channel/UCWUO7B2bVefoae-ruV4g3XQ/about` results).

## Videos found vs. already processed

`content/skool-news/processed_videos.json` already contained 40 processed video URLs, up through
roughly Skool News episodes in the #56–#65 range (non-sequential file naming, but includes #56,
#58, #60, #61, #62, #63, #64, #65 among others based on cross-referencing titles found during
search).

Via WebSearch, the following newer episodes were identified as **not** present in
`processed_video_urls`:

| Episode | Title | Video URL | Confidence |
|---|---|---|---|
| #66 | Free Trial + Freemium Improvements | https://www.youtube.com/watch?v=WoPcIfAYLyQ | Confirmed URL |
| #67 | Growth Boost is Boosting | https://www.youtube.com/watch?v=TK_UY-vJD6Y | Confirmed URL |
| #69 | Reviews Are Here! | https://www.youtube.com/watch?v=8NjPASpklh0 | Confirmed URL |
| #71 | Growth Boost Bidding System | https://www.youtube.com/watch?v=QVlZT_T_qPU | Confirmed URL |
| #72 | New Record: $1,000,000/month on Skool | https://www.youtube.com/watch?v=x9dx4HP1EiA | Confirmed URL |

**Episodes #68 ("Languages Are Here!", ~Aug 4 2026) and #70 (unknown title) were NOT included.**
Multiple WebSearch queries confirmed episode #68 exists (Skool adding Spanish/German with
auto-detect) and is referenced from a third-party Skool community post, but no query surfaced a
confirmable `youtube.com/watch?v=...` URL for it. Episode #70 could not be found at all — no
title, no URL. Per the routine's rule against inventing content, and by extension against
inventing or guessing video URLs, both were left out of this run rather than guessed. They should
be picked up in a future run once a working URL can be confirmed (e.g. once direct YouTube access
is restored, or via the RSS feed in a future run).

**5 new videos processed this run.**

## Transcript / sourcing quality per article

None of the 5 videos could be fetched directly (no page/description/transcript access — see
environment constraint above), so every article below is built from **real, video-specific facts
surfaced through WebSearch** (episode broadcast notes, third-party recaps, named people/numbers
tied to the specific episode), not from the title alone. Depth of sourcing varies per video:

- **#66 (Free Trial + Freemium Improvements)** — Good: found via a third-party "Skool News
  Broadcast Notes" recap describing the specific features shown (locked trial content, freemium
  upgrade button, new "Temporarily Closed" pause status). Real content, not title-only.
- **#67 (Growth Boost is Boosting)** — Good: found real named examples of owner results
  circulating around the same time as this episode (Lizzie Townsend, Evan Shawn), tied to the
  general Growth Boost feature this episode covers. Note: I could not 100% confirm these two
  named examples were spoken on-camera in this exact episode vs. being contemporaneous
  community chatter about the same feature — the article frames them as results "circulating
  this summer" rather than asserting they were named in the video, to stay accurate.
- **#69 (Reviews Are Here!)** — **Thin.** Only one concrete detail surfaced beyond the title: a
  review prompt fires on day 3 of membership. No further feature detail (verification gating,
  owner response ability, etc.) was found, so the article is honest about what's confirmed and
  spends more of its word count on implications rather than invented feature specifics.
- **#71 (Growth Boost Bidding System)** — Good: found the actual mechanic (a bid-percentage
  slider, applies only to new members, doesn't affect existing members).
- **#72 (New Record: $1,000,000/month)** — Good: found the named owner (Logan Sendle), his
  community (Blue-Collar Biz Accelerator), niche, revenue milestone, and background, all
  cross-confirmed across multiple independent sources (LinkedIn, Skool community page,
  third-party directory).

**Real content found for all 5 (none written from title alone), with #69 being noticeably
thinner than the other four.** Flagging #69 for a closer look/edit pass if a transcript becomes
accessible later.

## Files created

- `content/skool-news/skool-free-trial-freemium-temporarily-closed-update.md` (536 words)
- `content/skool-news/skool-growth-boost-success-stories-boosting.md` (495 words)
- `content/skool-news/skool-launches-reviews-feature-day-3-prompt.md` (456 words)
- `content/skool-news/skool-growth-boost-bidding-system-explained.md` (472 words)
- `content/skool-news/skool-first-1-million-month-logan-sendle-blue-collar.md` (461 words)

## processed_videos.json

Updated from 40 → 45 URLs (5 new, deduplicated, sorted). Validated as parseable JSON.

## Self-verification results

- [x] `processed_videos.json` valid (parses as JSON)
- [x] Every article has parsable YAML frontmatter (title, meta_description, source_video_url,
      source_video_title, published_date, word_count)
- [x] Every article has both required closing links (`Watch the original video` +
      `See how TrustSkool tracks Skool communities by real growth data`)
- [x] No article duplicates a slug already existing in `content/skool-news/`
- [x] Log written with real counts (above)

All checks passed — PR opened against `main`.

## Follow-up for next run

- Retry episodes #68 and #70 once a reliable YouTube-reachable method is available (RSS feed
  directly, or a working proxy) to confirm their video URLs rather than skipping them again.
- Consider re-checking #69 ("Reviews Are Here!") once more source material surfaces, since this
  run's sourcing for it was thin.
