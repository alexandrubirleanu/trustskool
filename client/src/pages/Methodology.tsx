import { BarChart3, LineChart, Lock, RefreshCw, Scale, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import SiteLayout from "@/components/SiteLayout";

/**
 * Methodology page: explains how the TrustSkore is computed.
 * Static content, no data fetching.
 */

const PILLARS = [
  {
    icon: LineChart,
    title: "Growth Momentum",
    weight: "45%",
    body: "We track each community's member count over time and measure how fast it grew across the recent observation window, with more recent growth weighted more heavily. Sustained, organic growth scores higher than short spikes.",
  },
  {
    icon: BarChart3,
    title: "Ranking Momentum",
    weight: "35%",
    body: "Skool's own discovery ranking reflects how a community performs against every other community on the platform. We record that rank over time and score communities that climb or hold strong positions.",
  },
  {
    icon: Scale,
    title: "Price Stability",
    weight: "20%",
    body: "Frequent price changes are often a sign of experimentation at members' expense. We track the entry price over time and reward communities that keep their pricing consistent and predictable.",
  },
];

const PRINCIPLES = [
  {
    icon: Lock,
    title: "No paid placements",
    body: "Nobody can buy a position on TrustSkool. Rankings are computed by the scoring engine alone; affiliate revenue never touches the formula.",
  },
  {
    icon: ShieldCheck,
    title: "No reviews, no opinions",
    body: "The TrustSkore uses only observable metrics. There are no star ratings, testimonials or editorial judgments involved anywhere in the score.",
  },
  {
    icon: RefreshCw,
    title: "Recomputed automatically",
    body: "A data pipeline refreshes community metrics on a regular cadence and every TrustSkore is recalculated automatically, so the leaderboard reflects the latest data without manual edits.",
  },
];

export default function Methodology() {
  return (
    <SiteLayout>
      <div className="container max-w-3xl py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Methodology
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-[40px] md:leading-tight">
          How the TrustSkore works
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          The TrustSkore is a 0–100 rating assigned to every Skool community in the TrustSkool
          index. It answers one question: <em>is this community actually growing and stable, or
          does it just market itself well?</em> The score is computed from public growth data on a
          fixed formula — never from reviews, testimonials or payments.
        </p>

        <section className="mt-12" aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="text-xl font-semibold">
            The three pillars
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Each community's score is a weighted average of three sub-indicators, each normalized
            to a 0–100 scale.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            {PILLARS.map(pillar => (
              <div key={pillar.title} className="rounded-[4px] border border-border bg-card p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-secondary">
                      <pillar.icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="text-base font-semibold">{pillar.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-[25px] border border-border px-3 py-1 text-xs font-semibold tabular-nums">
                    {pillar.weight}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[4px] border border-border bg-secondary/60 p-5 font-mono text-sm">
            TrustSkore = 0.45 × Growth Momentum + 0.35 × Ranking Momentum + 0.20 × Price Stability
          </div>
        </section>

        <section className="mt-12" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-xl font-semibold">
            Where the data comes from
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            An automated pipeline observes publicly visible information about each community —
            member counts, entry price and position in Skool's discovery ranking — and records it
            as a time series. TrustSkool ingests that dataset on a daily schedule, updates each
            community's record and recomputes every TrustSkore. No private or member-only data is
            collected, and communities cannot submit their own numbers.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="text-xl font-semibold">
            Ranking principles
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map(principle => (
              <div key={principle.title} className="rounded-[4px] border border-border bg-card p-5">
                <principle.icon className="h-5 w-5" />
                <h3 className="mt-3 text-sm font-semibold">{principle.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="reading-heading">
          <h2 id="reading-heading" className="text-xl font-semibold">
            How to read a score
          </h2>
          <div className="mt-4 overflow-hidden rounded-[4px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left">
                  <th className="px-4 py-2.5 font-semibold">Range</th>
                  <th className="px-4 py-2.5 font-semibold">Reading</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-semibold tabular-nums text-[oklch(0.5_0.12_155)]">70–100</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Strong, sustained growth with a stable offer. The community is expanding and
                    holding its position on the platform.
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-semibold tabular-nums text-[oklch(0.6_0.13_60)]">45–69</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Steady but unremarkable trajectory, or mixed signals — for example solid growth
                    paired with recent price changes.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[oklch(0.55_0.18_25)]">0–44</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Flat or declining membership, falling discovery rank, or unstable pricing over
                    the observation window.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            A low TrustSkore does not mean a community is a scam — it means its recent public
            growth record is weak. New communities with little history tend to start in the middle
            of the range until they build a track record.
          </p>
        </section>

        <section className="mt-12 rounded-[4px] border border-border bg-card p-6" aria-labelledby="disclosure-heading">
          <h2 id="disclosure-heading" className="text-base font-semibold">
            Independence and affiliate disclosure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Some outbound links on TrustSkool are affiliate links: if you join a community or
            create a Skool account through them, we may earn a commission at no extra cost to you.
            Commissions have zero influence on scores or ordering — the same formula runs for every
            community, whether or not a link earns anything. TrustSkool is an independent project
            and is not affiliated with Skool.com.
          </p>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[4px] border border-foreground bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.97]">
            Browse the rankings
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
