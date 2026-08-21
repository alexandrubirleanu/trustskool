# Skool News blog routine — 2026-08-21

## Outcome: 0 new articles written this run

## Existing unmerged backlog found first (important)

Before doing any new discovery, this run checked `main` and found that **two
previous Skool News routine PRs are still open, still in draft, and never
merged or closed**:

- PR #8 — `routine/skool-news-2026-08-01` — "[Routine] Skool News blog
  2026-08-01 — 1 articolo" — wrote an article for episode **#66** only
  (`skool-free-trial-freemium-improvements-close-door-upgrade-button.md`),
  deliberately skipped **#67** for lack of real source content.
- PR #9 — `routine/skool-news-2026-08-11` — "[Routine] Skool News blog
  2026-08-11 — 2 articoli" — re-did **#66** under a different slug
  (`skool-free-trial-freemium-close-door-features-explained.md`) **and**
  wrote **#67** (`skool-growth-boost-efficient-groups-success-stories.md`),
  self-flagged in its own log as the "weakest-sourced" article of the two.

Because neither PR is merged, `main`'s `processed_videos.json` still does not
contain #66 or #67, and both episodes would show up as "new" again to any
run that only checks `main`. Rather than opening a **third** overlapping PR
with a third treatment of the same two videos (and potentially a third
slug), this run treats #66 and #67 as **already handled and awaiting your
review** in PR #8 / PR #9, and does not touch them again. Recommend
resolving those two PRs first (merge one, close the other) so future runs
stop re-colliding with them.

## Discovery method (same environment blocker as the last two runs)

Direct access to `youtube.com` is still blocked by this session's network
egress proxy (`EGRESS_BLOCKED` on `www.youtube.com`, confirmed again this
run for the channel page, the `/feeds/videos.xml` RSS endpoint, and
individual video watch pages). This run additionally confirmed the same
`EGRESS_BLOCKED` response for `www.skool.com`, `en.wikipedia.org`, and
several third-party YouTube-transcript sites (youtubetranscript.com,
tactiq.io, downsub.com, notegpt.io, youtube-transcript.io) — this appears to
be a broad allowlist-based egress policy for this session, not a
YouTube-specific block. `WebFetch` cannot reach any of these hosts; only
`WebSearch` (which does not go through the same egress proxy) works. This is
the third consecutive run blocked this way — worth raising with whoever
configures this environment's network policy, since the routine cannot do
its primary job (RSS feed + real transcripts) without it.

Channel confirmed via search: `@skool-news`, channel ID
`UCWUO7B2bVefoae-ruV4g3XQ`.

## New episodes found beyond the existing backlog

Searched episode numbers #66 through #73 against `processed_video_urls`.
Three episodes beyond the #66/#67 backlog were found that are not in
`processed_videos.json` and are not covered by PR #8 or PR #9:

- **#68 — "Languages Are Here!"** — content found via a secondary source
  (a Skool community's own recap/mirror post, not Skool News' own
  description or a transcript): Skool is now available in Spanish and
  German, with auto-detection of the user's language. This is real,
  specific content, not invented from the title. **However, the actual
  YouTube video URL/ID for this episode could not be located** despite
  multiple targeted searches (title search, `site:youtube.com` search,
  channel search). Per the routine's rules, an article was **not** written,
  since `source_video_url` and the "Watch the original video" link would
  have no real URL to point to. Left OUT of `processed_videos.json` so a
  future run that can resolve the actual video URL (or has RSS access) can
  pick it up and write it properly.

- **#69 — "Reviews Are Here!"**
  (`https://www.youtube.com/watch?v=8NjPASpklh0`) — the only real,
  specific fact found via search was that Skool will prompt members to
  leave a review on Day 3. That's a single fact, not a chapter list or
  description, and not enough to responsibly fill a 400-700 word article
  without padding it with invented detail. No article written. Left OUT of
  `processed_videos.json`.

- **#70 — "Skool Goes Global"**
  (`https://www.youtube.com/watch?v=e4nV78zE7ho`) — only the title was
  found; no description, chapters, or third-party recap surfaced anything
  about its actual content. No article written. Left OUT of
  `processed_videos.json`.

No episode #71 or later was found in repeated searches, so #70 is treated as
the latest upload as of this run.

## Files changed this run

- `logs/skool-news-routine-2026-08-21.md` (this file) — only file changed.
- `content/skool-news/processed_videos.json` — **not modified**, since no
  video reached a real, published article this run.

## Self-verification

- [x] No article was written, so there is no frontmatter/slug/CTA-link
  check to run this time.
- [x] `content/skool-news/processed_videos.json` untouched — still valid
  JSON, unchanged from `main`.
- [x] Counts above reflect the actual search results and file diff from this
  run (one new file: this log).

## Recommendation for next run

1. Resolve PR #8 and PR #9 (merge whichever article set you prefer, close
   the other) so `processed_videos.json` on `main` catches up to #66/#67
   and stops causing repeat collisions.
2. If possible, allowlist `www.youtube.com` (at minimum the
   `/feeds/videos.xml` RSS endpoint) and ideally a transcript source for
   this session's network egress policy — three runs in a row (2026-08-01,
   2026-08-11, 2026-08-21) have been unable to do real transcript-based
   research and had to fall back to thin WebSearch snippets.
