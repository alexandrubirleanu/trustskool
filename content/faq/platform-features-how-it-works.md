---
title: "Skool Platform Features & How It Works: Every Question Answered"
meta_description: "Every real question about how Skool actually works: Classroom setup, drip content, points and levels, the leaderboard formula, Skool Call, Membership Questions, AutoDM, pixel tracking, the Skool Games, mobile apps, and more, answered directly with sourced specifics."
cluster: "Platform Features & How Skool Works"
question_count: 17
slug: platform-features-how-it-works
---

# Skool Platform Features & How It Works: Every Question Answered

*A direct, sourced answer to every real search query about Skool's features, from "what is Skool" down to how the "complete action" checkmark actually works.*

Most Skool explainers either stop at "it's a community platform with courses and gamification" or copy Skool's own marketing copy without checking whether a feature still works the way it did last year. This page answers all 17 questions in this cluster with the actual mechanics, pulled directly from [Skool's help center](https://help.skool.com) and cross-checked against recent platform changes, so you can set up (or evaluate) a Skool community without guessing. Where a question is really about whether a feature is worth using rather than how to click it, we answer that using what TrustSkool's own TrustSkore actually measures: real growth trend, discovery-rank movement, and price stability, not opinions.

## What is Skool, and how does it work?

Skool is an all-in-one platform for running an online community: one product combines a discussion feed, a course/content library ("Classroom"), an events calendar, native payments, and a gamified points-and-levels system, rather than stitching together separate tools for each. It was founded in 2019 by [Sam Ovens](https://whop.com/blog/what-is-skool/), bootstrapped out of his earlier company Consulting.com.

A Skool group is built around five tabs: **Community** (the post feed, ranked by recency and engagement), **Classroom** (courses broken into modules, each typically one video plus a description, files, and an optional action item), **Calendar** (events and live calls in each member's own timezone), **Members** (the roster, showing each member's level), and the **Leaderboard** (points-based rankings over 7-day, 30-day, and all-time windows). Group owners pay Skool directly ($9/month Hobby or $99/month Pro, per [skool.com/pricing](https://www.skool.com/pricing)) plus a transaction fee on any payments they collect from members through Skool, and members pay the group owner directly, not Skool, for access.

## What is Classroom, and how do you set up courses?

**Classroom** is Skool's content-hosting tab, where creators organize courses, guides, and resources into modules, per [Skool's own explainer](https://help.skool.com/article/166-what-is-classroom). Setting one up touches several distinct sub-features:

**Permissions.** When you add or edit a course, the default is "All members have access." To restrict it, set the course to Private, which exposes tier-based access (standard, premium, or VIP) and lets you combine it with Level Lock, a one-time "Buy Now" price, or a time-based unlock, connected with OR logic (e.g., Level 4 *or* Tier: Premium), per [Skool's permissions guide](https://help.skool.com/article/23-how-to-set-permissions-for-a-course).

**Member access overrides.** You can grant any individual member access to a course regardless of their level, tier, or payment status: open the Members tab, click Membership Settings next to their name, go to the Courses tab, and select the course, per [Skool's help article](https://help.skool.com/article/144-how-to-grant-course-access-to-members). This is also how you manually release dripped content early for a specific person.

**Drip content.** Each lesson (not the whole course by default) has its own drip toggle, releasing it a set number of days after the member joins. This is common enough to warrant its own answer below.

**Duplicating a course.** Within the same group, use the three-dot menu on a course and select Duplicate Course. To copy a course into a *different* group, use the three-dot menu's "Share course key" to generate and copy a key, then in the destination group's Classroom tab click "+ New course" → "Import with key" and paste it; the imported course lands as a draft, per [Skool's help article](https://help.skool.com/article/199-how-to-duplicate-a-course-to-another-group).

**Adding Vimeo/Loom videos.** Skool hosts video through four partners: YouTube, Vimeo, Wistia, and Loom. Add a page, click "Add video," and either paste a link or drag the file into the uploader; Vimeo and Loom each have their own dedicated setup articles ([Vimeo](https://help.skool.com/article/55-add-vimeo-videos-to-skool), [Loom](https://help.skool.com/article/225-how-to-add-loom-videos)).

**Troubleshooting playback.** If a video won't load, [Skool's troubleshooting article](https://help.skool.com/article/178-how-to-troubleshoot-video-issues) recommends disabling any VPN, switching networks (e.g., WiFi to LTE), and confirming which of the four hosting partners the course actually uses, since the fix is often on that partner's end rather than Skool's.

## Can you drip an entire course, or drip based on completing the previous item?

No, not natively, and this is one of the more common points of confusion. Skool's drip feature operates at the **individual lesson level**, on a **fixed day-count schedule** ("unlock 3 days after joining"), per [Skool's own drip documentation](https://help.skool.com/article/53-how-to-drip-the-content). There is no native toggle to drip an entire course as a single unit, and there is no "unlock the next lesson once the member marks the previous one complete" trigger, only time-based release.

In practice, this means replicating a whole-course drip requires manually setting a staggered day count on every lesson in that course, and there's no way to make progression conditional on actual completion rather than elapsed time. Community members have raised both of these as feature requests on the [Skool Community forum](https://www.skool.com/community/courses-on-drip), which is a reasonable signal the platform doesn't support them today. The one release mechanism that *is* instant rather than scheduled is the manual admin override covered above (Members tab → Membership Settings → Courses), which unlocks everything for a specific person regardless of the drip schedule.

## How do you set up one-time course purchases, and how do level-locked courses work?

**One-time purchases:** in a course's settings, select "Buy Now" and set a flat, one-time price. The member gets instant access on purchase, no recurring subscription involved, per [Skool's setup guide](https://help.skool.com/article/168-how-to-set-up-one-time-course-purchases). This is the standard mechanism for in-classroom upsells, individual event access, or à la carte offers sold separately from the main membership.

**Level-locked courses:** in course settings, select "Level unlock" and choose the level threshold a member must reach. Members earn points purely from engagement (see the points system below), and the course automatically unlocks the moment they cross that level, per [Skool's level-lock documentation](https://help.skool.com/article/145-how-does-level-locked-courses-work). Group admins can always see every course regardless of level restrictions, and level-lock can be combined with a tier requirement using OR logic, so you can gate content by "reach Level 5, *or* be on the Premium tier" simultaneously.

## How do points and levels work, and what's the actual leaderboard ranking formula?

This is worth being precise about, because there are actually two different "rankings" people mean when they say this, and confusing them causes real setup mistakes. This question is about the **member leaderboard inside a single community** (points and levels), not Skool's separate Discovery/search ranking algorithm that determines how communities themselves get surfaced to new members.

**Points:** the rule is genuinely one rule. Every like a member's post, comment, or reply receives earns that member 1 point, with no multipliers, no bonus categories, and no other point-earning action, per [Skool's help article](https://help.skool.com/article/183-how-do-points-and-level-work).

**Levels:** points accumulate against a fixed, exponential 9-level curve:

| Level | Points required |
|---|---|
| 1 | 0 |
| 2 | 5 |
| 3 | 20 |
| 4 | 65 |
| 5 | 155 |
| 6 | 515 |
| 7 | 2,015 |
| 8 | 8,015 |
| 9 | 33,015 |

Early levels come within days of normal activity; Level 9 realistically takes months of sustained engagement from a genuinely active member, which is by design, since it's meant to reward long-term participation rather than a single burst of posting.

**Leaderboard:** members are ranked by points across three separate windows, 7-day, 30-day, and all-time, each tracked as its own tab live on every group's Leaderboard page (for example, [Content Academy's](https://www.skool.com/content-academy/-/leaderboards) or [Creator Party's](https://www.skool.com/creator-party/-/leaderboards)). Each community's leaderboard is entirely independent: if you belong to five Skool groups, you have five separate point totals and five separate levels, starting fresh at Level 1 in each one, per [Skool's help documentation](https://help.skool.com/article/183-how-do-points-and-level-work). There's no cross-group point pooling and no global Skool-wide level.

## Can you customize gamification, and can members pay to level up?

Partially, on customization, and no, not officially, on paying for levels.

**Level names:** you can rename every level to fit your brand or niche (e.g., Apprentice → Innovator for a creative community, or Beginner → Champion for fitness), which Skool documents as a dedicated feature ([Skool Community announcement](https://www.skool.com/community/new-features-custom-level-names-unlock-courses-at-levels)). This is purely cosmetic; it changes the label shown next to a member's name, not the underlying point math.

**Point thresholds:** these are fixed. The exponential 9-level curve above is not user-adjustable in either direction, you cannot make Level 2 require 50 points instead of 5, or compress Level 9 down from 33,015 points.

**Pay to level up:** this is not a real, shipped Skool feature, despite it circulating as a rumor. A member of the Skool Community explicitly proposed it as a feature request, framed as an optional "pay to play" alternative sitting alongside the existing free, engagement-based leveling system ([Skool Community feature request](https://www.skool.com/community/gamification-pay-to-level-up-feature)). If you want the practical effect (a paying member gets access to level-gated content without grinding for points), the actual mechanism available today is the manual course-access override covered above, granting a specific course to a specific member directly, or combining a level-lock with an OR tier condition so a paid tier bypasses the level requirement entirely.

## Should you even use gamification and leaderboard rewards?

This is genuinely a judgment call, not a settings question, so here's the honest tradeoff rather than a reflexive "yes."

**Where it earns its keep:** points and levels give members a visible, low-cost reason to keep showing up, which matters most in exactly the window where communities are most fragile. Roughly 60% of members who eventually churn from a community decide to leave within their very first week, so a gamification layer that makes early participation feel rewarded (a quick early level-up, a visible leaderboard spot) is doing real retention work precisely when it counts most, not just adding decoration. Level-gating genuinely valuable content (not filler) also gives leveling up an actual payoff instead of a vanity number.

**Where it backfires:** the same mechanic that rewards genuine participation also rewards hollow participation. Skool's own 2026 Discovery ranking overhaul specifically targeted "comment bait," posts engineered purely to farm likes and replies for points, because it had become a real problem under the old system. A leaderboard with cash or physical prizes attached (as some communities run) pulls this risk forward: it can attract point-farmers optimizing for the reward rather than members who actually want to be there, and heavy top-of-leaderboard status can also feel exclusionary to newer members who will never catch up to founding members' point totals.

**The practical read, grounded in what actually predicts a healthy community rather than a busy one:** treat points and levels as a retention nudge layered on top of real value, not a substitute for it, and watch whether engagement quality (genuine discussion, course completion, member-to-member help) is rising alongside point totals, not just the totals themselves. That's the same growth-over-vanity-metric distinction TrustSkore is built to measure at the community level (sustained trend, not a raw activity spike) and it applies just as well one level down, inside a single group's own leaderboard.

## How are rejoining members and annual subscriptions handled in leaderboard/MRR calculations?

If you're running or watching a community during the **Skool Games** (covered fully below), this is the single most common source of "my numbers don't match" confusion, and the mismatch is by design, not a bug.

**Rejoining members:** subscription revenue from a member who cancels and later rejoins does **not** count toward your Games leaderboard MRR. The leaderboard only tracks revenue from genuinely new members, per [Skool's Games Leaderboard FAQ](https://help.skool.com/article/182-skool-games-leaderboard-faq).

**Annual subscriptions:** an annual payment is divided by 12 and counted as its monthly-equivalent contribution to MRR growth, rather than landing as one enormous single-month spike, per the same FAQ.

**Why your totals won't match:** your community's *total* MRR (every active paying member, including returning ones) and your Games leaderboard's *MRR Growth* figure (new revenue added since the contest period started, excluding rejoins) are measuring two different things on purpose. Seeing a gap between them is expected, not evidence of a tracking error. If the gap looks wrong even accounting for that distinction, Skool's guidance is to contact [Skool support](https://www.skool.com/support) directly for an account-level check, since generic community troubleshooting won't resolve an actual data bug.

Worth noting separately: for Games scoring specifically, any single member's subscription is capped at counting $100/month (or $1,200/year) toward your MRR growth, even if you charge more than that, per [Communipass's Skool Games research](https://communipass.com/blog/skool-revenue-benchmarks-2026/). A $175/month membership only contributes $100 of scored MRR per member.

## What is "daily activity," and how do you unlock a locked course or event?

**Daily activity** is a GitHub-style contribution heatmap on your Skool profile showing a full year of your own engagement: liking posts, creating posts, commenting, and participating in polls all light up the chart, with greener squares indicating more activity, and the timestamps are recorded in UTC rather than your local timezone, per [Skool's help article](https://help.skool.com/article/103-what-is-daily-activity). It's a personal activity log, not a leaderboard or a course-progress tracker.

**Unlocking a locked course or event** works through the same permission mechanisms covered above, applied consistently across both content types, per [Skool's unlock documentation](https://help.skool.com/article/101-how-to-unlock-a-locked-course-or-an-event):

- **Level-based:** automatically unlocks once you cross the required level (earned purely through likes, as covered above).
- **Time-based:** unlocks a set number of days after you join.
- **Access/bonus-locked:** typically requires a specific action or an additional payment; details are usually posted in a pinned post or classroom announcement rather than being self-explanatory, so check there (or ask an admin) before assuming a locked item is level-gated.

## How do you go live (Skool Call), create a webinar/event, and set permissions for it?

**Going live (Skool Call):** Skool has native live streaming built in, so you don't need Zoom, StreamYard, or any third-party tool. As an admin, clicking "Go Live" instantly creates a live event (labeled "Random Hangout" by default) for your group, with in-call chat, screen sharing (yours or a member's), background changes, and the ability to mute or remove participants, per [Skool's guide](https://help.skool.com/article/210-how-to-go-live-on-skool).

**Creating a scheduled event:** in the Calendar tab, click the "+" button to open the Add Event modal; the location defaults to Skool Call, and native calls are included on both the Hobby and Pro plans, per [Skool's event-creation guide](https://help.skool.com/article/146-how-to-create-an-event-in-your-group).

**Creating a webinar:** the dedicated "Skool Webinar" event type is confirmed as a **Pro-plan-only** feature, per [Skool's webinar guide](https://help.skool.com/article/214-how-to-create-webinar). From Calendar, click "Create new event" and select Skool Webinar rather than a standard call, then click "JOIN WEBINAR" at the scheduled time to start it. Skool draws the distinction as "a one-to-many presentation" (webinar) versus "a collaborative group call" (standard Skool Call): it's built for broadcast-style sessions where presenters lead and attendees participate in a more limited, audience-style role rather than an open group call.

**Setting permissions:** each event or call can be restricted independently, with four configurations available, per [Skool's permissions guide](https://help.skool.com/article/149-how-to-set-permissions-for-an-event): all members; a specific level and above (e.g., setting Level 3 grants access to levels 3 through 9); a specific tier and above (tiers inherit upward, so setting Standard also admits Premium and VIP, while setting VIP restricts it to VIP only); or members enrolled in a specific course. Tier and course-based restrictions are the two mechanisms for gating a call or webinar to paying members specifically.

## How do you set up Membership Questions, and where do you find members' answers?

**Setup:** click Settings in your community, go to Plugins, and click Edit next to "Membership questions." Toggle it on and add your questions; new members who click Join must answer every question before their request can be submitted, per [Skool's setup guide](https://help.skool.com/article/57-how-to-set-up-membership-questions). Commonly recommended questions include why they want to join, an email or social handle for follow-up contact, and where they discovered the group, since that last one doubles as informal acquisition-channel tracking.

**Finding answers:** open the Members tab, click on the specific member, then Membership Settings, then the Questions tab to see their individual responses. To review everyone's answers at once, use the Export button on the Members tab, per [Skool's help article](https://help.skool.com/article/148-where-can-i-find-members-answers-to-membership-questions).

## How do you set up group rules/categories, temporarily close your group, or enable the community map?

**Group rules:** Settings → Rules tab → Add new rule. Skool pre-populates a few default rules you can edit or delete outright; [Skool's own guidance](https://help.skool.com/article/189-how-to-setup-group-rules) recommends keeping rules short and specific rather than long legalistic lists members won't read.

**Categories:** Settings → Community → Categories, where you can add, edit, or reorder them, and set per-category posting permissions (members and admins, or admins-only), per [Skool's categories guide](https://help.skool.com/article/67-how-to-setup-categories). Categories are the primary way to keep a busy feed navigable without splitting into separate groups.

**Temporarily closing your group:** this is a real, named feature called **Lockdown**, not just "cancel and hope for the best." Go to Settings → Pricing tab → Lockdown, then confirm with "CLOSE THE DOORS." Existing members keep full access and continue being billed normally with zero disruption; the only effect is that new members can no longer join or request access, per [Skool's help article](https://help.skool.com/article/236-how-to-temporarily-close-the-group). This is the right tool when you need to pause growth (say, because support capacity is maxed out) without touching current members' experience at all; it's a different tool from canceling your Skool subscription entirely, which affects the whole group rather than just new-member intake.

**Community map:** Settings → Tabs → toggle on Map, which adds a tab showing where members are geographically located (self-reported), per [Skool's help article](https://help.skool.com/article/196-how-to-toggle-on-map-for-your-community). It's popular for location-based meetups and giving a global community a sense of its own reach.

## How do you add the "complete action" checkmark to a post?

This feature is officially called an **action post**. When creating a post, you can attach a specific instruction you want members to carry out (introduce yourself in the comments, share a screenshot of your setup, answer a specific question), and the post displays a checkmark that members can mark complete, most often by leaving the requested comment, per [Skool's feature announcement](https://www.skool.com/community/new-features-action-posts-pin-post-to-module). It's built for onboarding checklists, challenge-style content, and any post where you want a trackable "did they actually do the thing" signal rather than just a passive like.

One honest caveat: Skool doesn't currently maintain a single, stable, official step-by-step article for exactly where the "add action" toggle sits in the post composer, and multiple members have asked the exact same "where is this button" question in the [Skool Community](https://www.skool.com/community/how-do-i-add-the-complete-action-thing-to-my-post) without a definitive official reply on record. If you can't locate it immediately in your composer, check for a recent Skool changelog post, since Skool ships small UI relocations for its editor fairly often.

## How do you set up AutoDM, or Meta/Google Ads pixel tracking?

**AutoDM:** Settings → Plugins → Auto DM. Write your message using the `#NAME#` and `#GROUPNAME#` variables to personalize it automatically, preview it, choose which admin the message sends from, then save and toggle it on, per [Skool's setup guide](https://help.skool.com/article/64-how-to-set-up-autodm). New members receive it within roughly 1-5 minutes of joining, unless a conversation with them already exists, in which case it's skipped. The real limitation to know going in: this is a single message with no follow-up sequence and no way to re-engage someone who doesn't reply, so if you need a multi-step welcome sequence, you need a third-party layer like Skoot CRM on top of Skool's native AutoDM, not a setting Skool itself exposes.

**Meta/Facebook pixel tracking:** in Meta Business Manager, complete the recommended pixel setup and note the Pixel ID and access token. In Skool, go to Settings → Plugins → Facebook pixel tracking, turn it on, paste both values in, and click Connect. It tracks page views, membership requests, and purchases, everything needed to measure a paid-ads funnel into your group, per [Skool's setup guide](https://help.skool.com/article/163-how-to-set-up-facebook-pixel-tracking). Use one dedicated pixel per group and avoid layering a separate GTM container on top, since Skool warns that can interfere with its native tracking.

**Google Ads tracking:** enable the corresponding plugin and confirm the correct conversion label is installed, per [Skool's Google Ads guide](https://help.skool.com/article/173-google-ads-tracking). If conversions aren't registering, check that auto-tagging is enabled in your Google Ads account, verify tag firing with the Google Tag Assistant browser extension, and rule out an ad blocker suppressing the script on your own test device before assuming Skool's side is broken.

## What are the Skool Games, and how do they work?

The **Skool Games** are Skool's own recurring competition, closely associated with co-owner Alex Hormozi, where communities compete on **Monthly Recurring Revenue growth** rather than member count, content quality, or any subjective judgment. Every group created on Skool is enrolled by default. The format runs as a 90-day quarterly cycle (moved from an earlier monthly format) across roughly ten categories spanning niches like business, fitness, and personal development, per [Skool's Games Leaderboard FAQ](https://help.skool.com/article/182-skool-games-leaderboard-faq) and [independent Games coverage](https://discoverskool.com/skool-games/).

The leaderboard tracks **MRR Growth**: new recurring revenue added since the contest period started, not your community's total existing MRR (see the rejoining-members/annual-subscription answer above for exactly how that's calculated and why it diverges from your real total). Scoring also caps any single member's counted subscription at $100/month or $1,200/year, regardless of what you actually charge, per [Communipass's revenue-benchmarks research](https://communipass.com/blog/skool-revenue-benchmarks-2026/).

Prizes have historically gone to the top 5 finishers in each category: an all-expenses-paid trip to Los Angeles, a visit to Skool's headquarters, a one-day mastermind session with Alex Hormozi, and a physical Skool Games trophy; one earlier contest period (September-December 2024) also awarded a Tesla Cybertruck to the single top monthly finisher, per multiple independent write-ups of the program's history.

## Does Skool have a mobile app, and can you use your own custom domain?

**Mobile app:** yes, Skool ships official native apps for both [iOS](https://apps.apple.com/us/app/skool-communities/id6447270545) and Android, supporting posting, commenting, chat/messaging, video playback, events, and push notifications. One thing worth knowing before you tell members "download the app": it's a single shared app covering every Skool community on the platform, not a dedicated app for your group specifically, so members search "Skool" in their app store and then navigate to your community from inside it, per discussion in the [Skool Community](https://www.skool.com/community/skool-has-ios-android-apps).

**Custom domain:** no, and this is deliberate rather than a missing feature. Every Skool community lives permanently at `skool.com/[your-name]`, with Skool's own branding visible throughout; there is no option to point a custom domain (like `community.yourbrand.com`) at your group, and no white-label mode, per discussion in the [Skool Community](https://www.skool.com/community/custom-domain-and-branding). The only customization available is the URL slug itself: on the Hobby plan you're stuck with an auto-generated numeric suffix; on Pro, you get one free slug change, with additional changes priced at $99 each.

## What features does Skool offer for community builders overall?

Pulling everything above together, Skool's actual pitch to a community builder rests on three things, each with a real tradeoff attached:

**Engagement:** a single feed plus Classroom plus Calendar plus a points/levels/leaderboard system, all native, meaning a creator doesn't need to separately wire together a forum tool, an LMS, an events calendar, and a gamification plugin. The tradeoff, covered honestly above, is that the gamification layer rewards raw activity by default and needs deliberate design (genuinely valuable level-locked content, not vanity point-chasing) to avoid incentivizing hollow engagement.

**Monetization:** native payments with a straightforward two-tier fee structure (10% + $0.30 on Hobby, 2.9%-3.9% + $0.30 on Pro, per [skool.com/pricing](https://www.skool.com/pricing)), three built-in membership tiers (standard, premium, VIP), one-time course purchases, level-gated content, and a member-referral affiliate system a group owner can turn on for their own community. Skool also runs its own separate 40%-recurring affiliate program for people who refer new *paying group owners* to the platform itself, a different program from the member-referral one inside your own group.

**Ease of setup:** a flat, two-plan pricing model with a 14-day free trial and no card required to start is genuinely low-friction compared to platforms that gate features behind multiple pricing tiers. The direct cost of that simplicity is limited customization: no custom domain, no white-label mobile app, drip content that only works at the lesson level (not the whole course, and not completion-triggered), and a single-message AutoDM with no sequence builder. If your community needs deep CRM automation, multi-step DM sequences, or true white-labeling, expect to reach for a third-party layer (tools like Skoot CRM, or Zapier automations) rather than finding it natively inside Skool.

---

[Browse Skool communities ranked by real growth data](https://trustskool.com)
