---
title: "Skool's New Attribution System Explained: Per-Group, Last-Touch Tracking"
meta_description: "Skool shipped a rebuilt attribution system in June 2026: per-group last-touch tracking, 90-day vs 14-day cookie windows, and a fix for accidental affiliate credit. Here's how it actually works."
source_video_url: "https://www.youtube.com/watch?v=7VGd8fxQ9vI"
source_video_title: "New Attribution System + OMG Gossip | Skool News #59"
published_date: 2026-06-02
word_count: 638
---

# Skool's New Attribution System Explained: Per-Group, Last-Touch Tracking

In episode #59 of Skool News, the Skool team walks through a rebuilt version of the platform's traffic attribution system, the tool that tells community owners where their visitors and sign-ups actually came from, then closes out with a roadmap update and a stack of screenshots from owners whose communities showed up in Skool's own ad placements.

## Why attribution needed a rebuild

Attribution, in Skool's language, means figuring out which traffic source deserves credit for a sign-up: Skool Network, Facebook, Instagram, an affiliate link, Google, YouTube, and so on. It sounds simple until you consider that people bounce between multiple sources before actually joining, and the old system had a real flaw: attribution was tracked platform-wide instead of per group. If someone clicked your affiliate link, joined a different community first, then joined yours later, the old system could still hand you affiliate credit for a group you never actually sent them to. The team describes this as "bleed over," and it led to real confusion, including affiliates getting blamed (or credited) for referrals they never made.

## What actually changed

The new system fixes this in two ways. First, attribution is now scoped **per group** rather than platform-wide, so credit from one group's traffic can no longer leak into another. Second, attribution now locks at the moment someone **requests** to join (not when they're approved), which matters for free communities where a visitor can sit in a pending state for a while, potentially clicking other links in the meantime and scrambling who gets credit.

The mechanics are last-touch attribution with two different cookie windows depending on the source type:

- **External sources** (YouTube, Instagram, Facebook, Google, TikTok, LinkedIn, X, your own website, or any Facebook/Instagram ad) get a **90-day cookie**.
- **Skool Network and affiliate links** get a **14-day cookie**, matching Skool's existing 14-day affiliate payout window.

If the last-touched source's cookie has expired by the time someone joins, credit falls back to whichever earlier source is still valid. Once every cookie has expired, the join gets marked as direct. Importantly, there's nothing for owners or affiliates to configure: no UTMs, no special tracking links. Sharing the plain about-page link is explicitly the most accurate option, since extra tracking effort can actually make attribution less precise.

## What this means if you run (or evaluate) a Skool community

Owners should expect Skool Network and affiliate attribution numbers to look smaller going forward, not because traffic dropped, but because the platform-wide bleed-over that used to inflate those numbers is gone. Practically, that means owners running affiliate programs will owe fewer accidental commissions on the same actual member volume, since credit now reflects real intent-to-refer more precisely. If you're comparing communities by growth channel mix on a directory like TrustSkool, this is a meaningful methodology shift worth knowing about when interpreting before-and-after numbers from June 2026 onward, since the new system went live the day the episode was recorded.

## Roadmap and other notes

Briefly teased alongside the attribution update: native multi-language support (in active engineering work), currency support (further out), and a push toward near-instant global payouts, since some countries currently wait up to seven days to get paid versus overnight in the US and Europe. A "secret project" was mentioned with zero details given.

The episode's back half is lighter: a roundup of community owners posting screenshots of their groups appearing in Skool's own ad placements and the Discovery feed, plus a "school of the week" segment spotlighting real numbers from small niche communities, ranging from a free 2,000-member fairy-house-building group to a $34,000/month neurodivergence-focused community with under 1,500 members, an underscore of how much revenue variance exists across niches regardless of size.

[Watch the original video](https://www.youtube.com/watch?v=7VGd8fxQ9vI)

[See how TrustSkool tracks Skool communities by real growth data](https://trustskool.com)
