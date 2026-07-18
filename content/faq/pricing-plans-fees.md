---
title: "Skool Pricing, Plans & Transaction Fees: Every Question Answered"
meta_description: "Skool Hobby vs Pro pricing, real transaction fees, break-even math, admin limits, free trial, Growth Boost commission, and free-vs-paid data — every Skool pricing question answered in one place."
cluster: "Pricing, Plans & Transaction Fees"
question_count: 15
---

# Skool Pricing, Plans & Transaction Fees: Every Question Answered

Skool runs on two plans, a per-transaction fee that changes depending on which one you pick, and a handful of pricing mechanics (trials, annual billing, Growth Boost) that most comparison articles gloss over. Below is every question people actually ask about Skool pricing, answered with the specific numbers, not vague ranges. Where third-party data conflicts, we say so instead of picking a side.

## How much does Skool cost overall — what are the Hobby and Pro plan prices?

Skool has two plans: **Hobby at $9/month** and **Pro at $99/month**. Both are billed as flat monthly (or annual) subscriptions regardless of how many members you have — there's no per-member pricing tier above that. Every group also pays a separate transaction fee on top of the subscription whenever a member pays for access, which is where the real cost difference between the two plans shows up ([skool.com/pricing](https://www.skool.com/pricing), [Skool Help Center](https://help.skool.com/article/86-subscriptions-faq)).

## What's the difference between the Hobby ($9/mo) and Pro ($99/mo) plans, and which one should you pick?

Feature-for-feature, Hobby and Pro look almost identical: both include unlimited members, unlimited courses, unlimited videos, unlimited live calls, and a custom URL. The differences that actually matter are the transaction fee (10% on Hobby vs. 2.9%-3.9% on Pro, detailed below), the number of admins you can add (1 on Hobby vs. multiple on Pro — see below), and eligibility for platform features like Growth Boost. Pick Hobby if you're running a free or low-revenue community where the $90/month savings beats the fee difference; pick Pro once your paid transaction volume is approaching roughly $1,250-$1,300/month (the break-even point, calculated below) or you need a second/third admin to help run the group.

## What are Skool's transaction fees on each plan?

- **Hobby**: 10% + $0.30 per transaction, on every sale regardless of size.
- **Pro**: 2.9% + $0.30 per transaction for any single sale up to $899. On any single sale above $899, the rate jumps to 3.9% + $0.30 on that transaction.

This is a *per-transaction* threshold, not a monthly cap — a $50/month membership charge is always taxed at 2.9%+30¢ on Pro, while a one-time $1,200 course sale would hit the 3.9%+30¢ tier ([Skool Help Center: Payments FAQ](https://help.skool.com/article/86-subscriptions-faq)).

## Is Skool's transaction fee actually cheaper than paying Stripe directly?

It depends which side of $899 your transactions fall on. Below $899, Pro's 2.9% + $0.30 is essentially Skool passing through raw Stripe processing at cost — and Skool absorbs Stripe's extra surcharges for international cards (+1.5%) and recurring subscriptions (+0.5%) that you'd otherwise pay if you ran Stripe yourself, so for a mixed domestic/international membership base, Pro often works out cheaper than a self-managed Stripe integration. Above $899 per transaction, Skool adds a full extra 1% on top of Stripe's normal rate (3.9% vs. Stripe's flat 2.9%), so high-ticket, one-time sales are where Skool's cut is genuinely more expensive than raw Stripe. Hobby's 10% is not a Stripe comparison at all — it's the premium you pay for accessing Skool's platform at $9/month instead of $99/month.

## At what revenue level does Pro's lower transaction fee offset its higher monthly price?

Set the two plans' total monthly cost equal and solve for revenue (R): Hobby costs $9 + 10% of R; Pro costs $99 + 2.9% of R. Solving 9 + 0.10R = 99 + 0.029R gives R ≈ **$1,268/month** in paid transaction volume. Below that, Hobby's lower base fee wins; above it, Pro's lower percentage cut wins by an increasing margin as revenue grows. Most pricing breakdowns round this to "under $1,300/month, stay on Hobby" as a rule of thumb ([Kourses](https://kourses.com/skool-pricing/)).

## Can you upgrade or downgrade between Hobby and Pro plans, and when should you upgrade?

Yes — you can switch plans at any time from your group's billing settings, and the change applies with prorated billing rather than forcing you to wait for a renewal date. The trigger points to upgrade are: your paid transaction volume is nearing the ~$1,268/month break-even math above, you need a second or third person with admin access to help moderate or manage the community, or you want features gated to Pro such as Growth Boost eligibility. There's no lock-in or penalty for downgrading back to Hobby if revenue drops.

## Does Skool offer a free trial, and how long is it?

Yes — both Hobby and Pro come with a **14-day free trial**, and no card is required to start exploring the platform. If you continue past 14 days you're moved onto the paid plan you selected. This is separate from the optional trial periods you can configure for your *own* members joining a paid subscription group inside your community (up to 7 days, set per-group in your pricing settings) — those are a creator-configurable feature, not Skool's own trial of its platform ([Skool Help Center: pricing setup](https://help.skool.com/article/215-how-to-setup-pricing-for-the-group)).

## Is there an annual billing discount (e.g. "2 months free")?

Yes. Toggling either plan to annual billing gives you 2 months free — you pay for 10 months of service across the year instead of 12, which works out to roughly a 16.7% discount. In practice that puts Hobby at an effective **$7.50/month ($90/year)** and Pro at an effective **$82.50/month ($990/year)**. There are no other coupon codes or promotional discounts — Skool's pricing is deliberately just the two published numbers plus this one annual toggle.

## How many admins does each plan allow?

The Hobby plan gives you **1 admin** — just yourself. The Pro plan allows **multiple admins** (third-party trackers commonly cite a practical cap around 30), which is the plan you need if you want to delegate moderation, content posting, or community management to teammates rather than running everything solo.

## How do you set up pricing for your group, and what pricing models are available?

Once you've connected a bank account via Skool's Stripe Express integration, you can set a price for your group under its pricing settings. Skool supports five models: **Free** (no charge), **Subscription** (recurring monthly or annual membership, optionally with a creator-configured trial of up to 7 days), **Freemium** (a free tier plus one paid upgrade tier members can move into anytime), **Tiers** (multiple paid plans at different price points and benefit levels, with no free tier), and **One-time payment** (a single flat fee for permanent access — suited to lifetime-access courses, pop-up cohorts, or single seminars) ([Skool Help Center: how to set up pricing for the group](https://help.skool.com/article/215-how-to-setup-pricing-for-the-group)).

## Is Skool worth $99/month — is the Pro plan worth it?

It's worth it once your math crosses the break-even point above (~$1,268/month in paid volume) or once you need more than one admin — below that line, you're paying $90/month extra for a fee reduction you're not generating enough revenue to benefit from. Where TrustSkore's underlying data is actually useful here: instead of guessing whether a niche or format justifies Pro, look at communities in your category with a strong TrustSkore trend (rising member growth, stable or improving discovery rank, stable pricing) — those are the ones whose creators clearly crossed the revenue threshold where Pro pays for itself, and they're a better benchmark than generic "is Pro worth it" opinion pieces.

## When and why did Skool introduce the cheaper $9/month Hobby plan?

Before the Hobby plan existed, Pro at $99/month was the *only* way onto Skool — a real barrier for hobbyists, side-project creators, and anyone testing an idea before committing to monetizing it. Skool added the $9/month Hobby tier to remove that entry barrier, trading a higher transaction fee (10% vs. Pro's 2.9%) for a much lower fixed monthly cost, which makes sense for free communities or ones with low, early-stage transaction volume. It's a relatively recent addition to Skool's pricing structure rather than something that's existed since the platform's early days.

## Does Skool support PayPal, or only Stripe/card payments, and are there currency-conversion or payout fees?

Skool only supports card payments processed through **Stripe Express** — PayPal is not supported as a payment method for members joining a paid group, despite recurring requests (particularly from creators in markets like Germany where PayPal is a dominant preference). All group prices are set and charged in USD. Payouts to creators go out weekly (every Wednesday) directly to your connected bank account in your local currency, with domestic US transfers taking roughly 1-3 business days and international accounts 3-5 business days; your very first payout can take up to 14 days while Stripe completes account verification ([Skool Help Center: Payments FAQ](https://help.skool.com/article/86-subscriptions-faq)).

## What percentage of Skool communities are free vs. paid?

This is a genuine data contradiction between third-party studies, not a settled number. One analysis of **2,629 Skool communities** found roughly **70% free / 30% paid**. A separate analysis of **1,000 Skool communities** found closer to **40% free / 60% paid**. The gap likely comes down to sampling differences — which discovery categories, size tiers, or activity thresholds each study pulled from — and neither is an official Skool-published figure, since Skool itself doesn't publish this split. Treat any single "X% of Skool groups are paid" claim you see elsewhere with the same skepticism: it depends entirely on which slice of the ~8,150+ communities the sample came from.

## What is Skool's Growth Boost, and does it cost extra?

Growth Boost is Skool's own acquisition engine for your group: Skool runs paid ads and improves your placement in on-platform search/discovery results, at Skool's expense, to bring you new paying members. In exchange, Skool takes a **30% commission** on any sale it drives this way — for example, a $10/month membership signup sourced through Growth Boost has $3 deducted as commission, on top of the normal processing/platform transaction fee that already applies to that sale. That 30% cut applies for as long as the member's subscription stays active, not just the first payment. If you bring your own member through your own marketing, Growth Boost takes nothing beyond the standard transaction fee. It's enabled by default on new groups and can be switched off anytime from Settings → Discovery if you'd rather not have Skool run paid acquisition on your behalf.

---

[Browse Skool communities ranked by real growth data](https://trustskool.com)
