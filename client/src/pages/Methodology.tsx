import { AlertTriangle, BarChart3, BookOpen, Clock, Database, LineChart, Lock, RefreshCw, Scale, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import SiteLayout from "@/components/SiteLayout";

/**
 * Methodology page v2 — full TrustSkore trust-foundation hub.
 * Static content, no data fetching.
 *
 * Weights verified from: server/trustskore.ts + shared/appConfig.ts
 *   growth_momentum:  0.45  (45%)
 *   ranking_momentum: 0.35  (35%)
 *   price_stability:  0.20  (20%)
 */

export default function Methodology() {
  return (
    <SiteLayout>
      <div className="container max-w-3xl py-12 md:py-16">
        {/* Page header */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Methodology · v1.1 · July 2025
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl md:text-[40px] md:leading-tight">
          How the TrustSkore is calculated
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          The TrustSkore is a 0–100 algorithmic momentum indicator assigned to every Skool
          community in the TrustSkool index. It answers one question:{" "}
          <em>is this community actually growing and stable, or does it just market itself well?</em>{" "}
          The score is computed from publicly observable signals on a fixed, versioned formula,
          never from reviews, testimonials or payments.
        </p>

        {/* TOC */}
        <nav className="mt-8 rounded-[4px] border border-border bg-card p-5 text-sm" aria-label="On this page">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
          <ol className="space-y-1.5 text-foreground/80">
            {[
              ["#formula", "1. The formula & exact weights"],
              ["#worked-example", "2. Worked numeric example"],
              ["#what-it-is-not", "3. What TrustSkore is NOT"],
              ["#anti-gaming", "4. Anti-gaming & anomaly detection"],
              ["#data-sources", "5. Data sources & provenance"],
              ["#limitations", "6. Limitations"],
              ["#commission-firewall", "7. Commission firewall"],
              ["#changelog", "8. Changelog"],
              ["#mrr", "9. Estimated Revenue figures"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-foreground transition-colors">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── 1. Formula & weights ─────────────────────────────────────────── */}
        <section className="mt-14" id="formula" aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="text-xl font-semibold">1. The formula & exact weights</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The TrustSkore is a weighted average of three sub-indicators, each independently
            normalized to a 0–100 scale before combination.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {/* Growth Momentum */}
            <div className="rounded-[4px] border border-border bg-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-secondary">
                    <LineChart className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-semibold">Growth Momentum</h3>
                </div>
                <span className="shrink-0 rounded-[25px] border border-border px-3 py-1 text-xs font-semibold tabular-nums">45%</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Measures the percentage change in total member count over the most recent{" "}
                <strong className="font-medium text-foreground">30-day lookback window</strong>.
                The raw growth percentage is mapped to a 0–100 score via a saturating exponential
                curve: 0% growth → 50 (neutral); +20% growth → ~97; negative growth decays toward 0
                (losses penalised more steeply than gains are rewarded).
              </p>
              <div className="mt-3 rounded-[4px] bg-secondary/60 p-3 font-mono text-xs">
                <span className="text-muted-foreground">// pct ≥ 0:</span>{" "}
                score = 50 + 50 × (1 − e<sup>−pct/7</sup>)<br />
                <span className="text-muted-foreground">// pct &lt; 0:</span>{" "}
                score = 50 × e<sup>pct/10</sup>
              </div>
            </div>

            {/* Ranking Momentum */}
            <div className="rounded-[4px] border border-border bg-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-secondary">
                    <BarChart3 className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-semibold">Ranking Momentum</h3>
                </div>
                <span className="shrink-0 rounded-[25px] border border-border px-3 py-1 text-xs font-semibold tabular-nums">35%</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Measures the relative change in Skool's own discovery rank over the{" "}
                <strong className="font-medium text-foreground">full available rank history</strong>{" "}
                (lower rank number = better position). The relative improvement is mapped via a
                hyperbolic tangent: a community that improved its rank by 40% scores above 50; one
                that fell by 40% scores below 50.
              </p>
              <div className="mt-3 rounded-[4px] bg-secondary/60 p-3 font-mono text-xs">
                improvement = (rank_first − rank_last) / rank_first<br />
                score = 50 + 50 × tanh(improvement × 2)
              </div>
            </div>

            {/* Price Stability */}
            <div className="rounded-[4px] border border-border bg-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-secondary">
                    <Scale className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-semibold">Price Stability</h3>
                </div>
                <span className="shrink-0 rounded-[25px] border border-border px-3 py-1 text-xs font-semibold tabular-nums">20%</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tracks the entry price over the{" "}
                <strong className="font-medium text-foreground">full available price history</strong>.
                Free communities and communities with an unchanged price score 100. Each detected
                price change deducts 15 points; each price <em>increase</em> deducts an additional
                10 points. Score is clamped to 0 minimum.
              </p>
              <div className="mt-3 rounded-[4px] bg-secondary/60 p-3 font-mono text-xs">
                penalty = changes × 15 + increases × 10<br />
                score = max(0, 100 − penalty)
              </div>
            </div>
          </div>

          {/* Final formula */}
          <div className="mt-6 rounded-[4px] border border-foreground/20 bg-secondary/60 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final formula</p>
            <p className="font-mono text-sm">
              TrustSkore = 0.45 × Growth Momentum + 0.35 × Ranking Momentum + 0.20 × Price Stability
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              All three sub-scores are on a 0–100 scale. The final TrustSkore is clamped to [0, 100]
              and rounded to two decimal places. The score is refreshed on each daily ingestion run.
            </p>
          </div>
        </section>

        {/* ── 2. Worked numeric example ─────────────────────────────────────── */}
        <section className="mt-14" id="worked-example" aria-labelledby="example-heading">
          <h2 id="example-heading" className="text-xl font-semibold">2. Worked numeric example</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The following example uses realistic inputs to walk through every step of the
            calculation. The dataset is still in its first days of operation: once the daily
            pipeline has accumulated at least three snapshots per community, this section will be
            replaced with a real indexed community and its actual stored history.
          </p>

          <div className="mt-5 rounded-[4px] border border-border bg-card p-5 md:p-6 text-sm">
            <p className="font-semibold">Community: "Creator Growth Academy" · illustrative example</p>

            <div className="mt-4 space-y-5">
              {/* Step 1 */}
              <div>
                <p className="font-medium">Step 1: Growth Momentum (weight 45%)</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Member count 30 days ago: <strong className="text-foreground">2,000</strong></li>
                  <li>Member count today: <strong className="text-foreground">2,340</strong></li>
                  <li>Growth % = (2,340 − 2,000) / 2,000 × 100 = <strong className="text-foreground">+17.0%</strong></li>
                  <li>Score = 50 + 50 × (1 − e<sup>−17/7</sup>) = 50 + 50 × (1 − 0.0889) = 50 + 50 × 0.911 ≈ <strong className="text-foreground">95.6</strong></li>
                </ul>
              </div>

              {/* Step 2 */}
              <div>
                <p className="font-medium">Step 2: Ranking Momentum (weight 35%)</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Discovery rank at first recorded data point: <strong className="text-foreground">850</strong></li>
                  <li>Discovery rank today: <strong className="text-foreground">510</strong></li>
                  <li>Relative improvement = (850 − 510) / 850 = <strong className="text-foreground">+0.400</strong></li>
                  <li>Score = 50 + 50 × tanh(0.400 × 2) = 50 + 50 × tanh(0.8) = 50 + 50 × 0.664 ≈ <strong className="text-foreground">83.2</strong></li>
                </ul>
              </div>

              {/* Step 3 */}
              <div>
                <p className="font-medium">Step 3: Price Stability (weight 20%)</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Price history: $49/mo → $49/mo → $67/mo (1 change, 1 increase)</li>
                  <li>Penalty = 1 × 15 + 1 × 10 = <strong className="text-foreground">25</strong></li>
                  <li>Score = max(0, 100 − 25) = <strong className="text-foreground">75.0</strong></li>
                </ul>
              </div>

              {/* Final */}
              <div className="rounded-[4px] bg-secondary/60 p-4 font-mono text-xs">
                TrustSkore = 0.45 × 95.6 + 0.35 × 83.2 + 0.20 × 75.0<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 43.02 + 29.12 + 15.00<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <strong>87.1</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. What TrustSkore is NOT ─────────────────────────────────────── */}
        <section className="mt-14" id="what-it-is-not" aria-labelledby="not-heading">
          <h2 id="not-heading" className="text-xl font-semibold">3. What TrustSkore is NOT</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Understanding what the TrustSkore does not measure is as important as understanding
            what it does. This section exists to prevent misinterpretation.
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                label: "Not a measure of community quality or content value",
                body: "The TrustSkore says nothing about whether the courses, coaching or content inside a community are good. A community with excellent content but slow member growth will score lower than a community with mediocre content that is growing fast.",
              },
              {
                label: "Not a measure of member satisfaction",
                body: "No user reviews, star ratings or satisfaction surveys are collected or factored into the score. The TrustSkore is derived entirely from public, observable signals: member count, discovery rank and entry price.",
              },
              {
                label: "Not an editorial recommendation",
                body: "TrustSkool does not endorse, recommend or vouch for any community. The score is a momentum indicator, not a quality seal. You should evaluate a community's content, creator reputation and fit for your goals independently.",
              },
              {
                label: "Not a review or rating in the Google sense",
                body: "The TrustSkore is an algorithmic composite with zero user input. It is not marked up as a Review or AggregateRating in structured data and does not qualify for Google's review rich results. It is presented as a plain numeric indicator.",
              },
              {
                label: "Not a guarantee of safety or legitimacy",
                body: "A high TrustSkore means a community is growing and price-stable. It does not mean the community is free from fraud, misleading claims or harmful content. See our fraud response policy for how we handle credible reports.",
              },
            ].map(item => (
              <div key={item.label} className="rounded-[4px] border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">✕ {item.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Anti-gaming & anomaly detection ───────────────────────────── */}
        <section className="mt-14" id="anti-gaming" aria-labelledby="gaming-heading">
          <h2 id="gaming-heading" className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> 4. Anti-gaming & anomaly detection
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Any public metric can be gamed. We document our current defenses honestly, including
            their limitations, and our roadmap for improving them.
          </p>

          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-[4px] border border-border bg-card p-5">
              <p className="font-semibold">Known attack vectors</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Bulk invite inflation:</strong> A creator can invite large numbers of contacts to inflate member count in a short window, producing a growth spike that does not reflect organic interest.</li>
                <li><strong className="text-foreground">Engagement-pod rank manipulation:</strong> Coordinated activity within a community can temporarily boost its Skool discovery rank without genuine audience growth.</li>
              </ul>
            </div>

            <div className="rounded-[4px] border border-border bg-card p-5">
              <p className="font-semibold">Current defenses (v1.1)</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Spike dampening via log-scale saturation:</strong> The growth momentum formula uses a saturating exponential (not linear growth). A +100% spike in one day produces a score of ~99, the same as sustained +20%/month growth. The formula does not reward velocity beyond a threshold.</li>
                <li><strong className="text-foreground">Multi-window consistency check (planned):</strong> We plan to compare 7-day, 30-day and 90-day growth windows. A community that shows a large 7-day spike but flat 90-day growth will be flagged for manual review before its score is surfaced in promoted positions.</li>
                <li><strong className="text-foreground">Rank cross-check against member growth (planned):</strong> Unusually high rank improvement paired with flat or declining member growth is a signal of engagement-pod activity. We plan to flag such cases and apply a dampening factor to the ranking momentum sub-score.</li>
              </ul>
            </div>

            <div className="rounded-[4px] border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200">
              <strong>Honest limitation:</strong> The current v1.1 engine does not yet implement the planned cross-window checks. A sufficiently large bulk invite campaign can still produce a temporarily inflated score. We publish this limitation explicitly so users can weigh it in their evaluation.
            </div>
          </div>
        </section>

        {/* ── 5. Data sources & provenance ─────────────────────────────────── */}
        <section className="mt-14" id="data-sources" aria-labelledby="data-heading">
          <h2 id="data-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Database className="h-5 w-5" /> 5. Data sources & provenance
          </h2>

          <div className="mt-5 overflow-hidden rounded-[4px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left">
                  <th className="px-4 py-2.5 font-semibold">Signal</th>
                  <th className="px-4 py-2.5 font-semibold">Source</th>
                  <th className="px-4 py-2.5 font-semibold">Collection</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium">Member count</td>
                  <td className="px-4 py-3 text-muted-foreground">Skool public discovery listing (visible to any visitor)</td>
                  <td className="px-4 py-3 text-muted-foreground">Daily automated crawl</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Discovery rank</td>
                  <td className="px-4 py-3 text-muted-foreground">Position in Skool's public community directory</td>
                  <td className="px-4 py-3 text-muted-foreground">Daily automated crawl</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Entry price</td>
                  <td className="px-4 py-3 text-muted-foreground">Publicly displayed price on each community's Skool page</td>
                  <td className="px-4 py-3 text-muted-foreground">Daily automated crawl</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p><strong className="font-medium text-foreground">Collection mechanism:</strong> An automated crawler visits Skool's public discovery pages and individual community pages. No authentication, private data or member-only content is accessed.</p>
            <p><strong className="font-medium text-foreground">Collection frequency:</strong> High-traffic language segments (English, Spanish, German, French) are refreshed daily. Lower-traffic language segments rotate on an approximately 72-hour cycle. All TrustSkores are recomputed after each ingestion run.</p>
            <p><strong className="font-medium text-foreground">Coverage:</strong> Only communities that appear in Skool's public discovery listing are indexed. Private, unlisted and invite-only communities are not included.</p>
            <p><strong className="font-medium text-foreground">No community self-submission:</strong> Communities cannot submit, correct or influence their own data. All inputs come exclusively from the automated crawl.</p>
          </div>
        </section>

        {/* ── 6. Limitations ───────────────────────────────────────────────── */}
        <section className="mt-14" id="limitations" aria-labelledby="limits-heading">
          <h2 id="limits-heading" className="text-xl font-semibold">6. Limitations</h2>
          <div className="mt-5 space-y-3 text-sm">
            {[
              {
                title: "Private and unlisted communities are not indexed",
                body: "Many high-quality communities operate outside Skool's public discovery listing. TrustSkool only covers publicly discoverable communities, so the index is not exhaustive.",
              },
              {
                title: "New and small communities have volatile scores",
                body: "Communities with fewer than ~100 members or fewer than 14 days of history have very noisy trend data. A single day of unusual activity can swing the score significantly. Treat scores for new communities as provisional.",
              },
              {
                title: "Seasonal cohort launches distort short-term momentum",
                body: "Creators who run cohort-based programs may show large member spikes at launch followed by flat or declining periods. The 30-day growth window can capture either the spike or the plateau depending on timing, producing scores that do not reflect the community's long-term trajectory.",
              },
              {
                title: "Discovery rank reflects Skool's own algorithm, not ours",
                body: "We observe Skool's discovery rank but do not control it. Changes to Skool's internal ranking algorithm can produce rank movements that have nothing to do with a community's actual performance.",
              },
              {
                title: "Price history only captures the entry price",
                body: "Upsells, payment plans, or changes to what is included at a given price are not tracked. A community that raises its price but also substantially increases its value would score the same as one that raises its price without adding value.",
              },
            ].map(item => (
              <div key={item.title} className="rounded-[4px] border border-border bg-card p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1.5 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. Commission firewall ────────────────────────────────────────── */}
        <section className="mt-14" id="commission-firewall" aria-labelledby="firewall-heading">
          <h2 id="firewall-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Lock className="h-5 w-5" /> 7. Commission firewall
          </h2>
          <div className="mt-5 rounded-[4px] border border-border bg-card p-5 text-sm leading-relaxed">
            <p>
              Some outbound links on TrustSkool are affiliate links: if you join a community or
              create a Skool account through them, TrustSkool may earn a commission at no extra
              cost to you. All affiliate links are marked with <code className="rounded bg-secondary px-1 py-0.5 text-xs">rel="sponsored"</code>.
            </p>
            <p className="mt-3">
              <strong>The scoring engine has no access to affiliate commission data.</strong> The
              formula reads only member history, rank history and price history, fields that exist
              in the database before any affiliate link is created. Whether a community has an
              active affiliate link, a higher commission rate, or no link at all has zero effect on
              its TrustSkore or its position in any ranking.
            </p>
            <p className="mt-3">
              If a community is flagged under our fraud response policy, its affiliate link is
              suspended until the flag is resolved, meaning TrustSkool stops earning from that
              community while it is under review.
            </p>
          </div>
        </section>

        {/* ── 8. Changelog ─────────────────────────────────────────────────── */}
        <section className="mt-14" id="changelog" aria-labelledby="changelog-heading">
          <h2 id="changelog-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5" /> 8. Changelog
          </h2>
          <div className="mt-5 overflow-hidden rounded-[4px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left">
                  <th className="px-4 py-2.5 font-semibold">Version</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Changes</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">v1.1</td>
                  <td className="px-4 py-3 text-muted-foreground">July 2025</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Added worked numeric example, "What TrustSkore is NOT" section, anti-gaming
                    documentation, data provenance table, limitations, commission firewall statement,
                    and this changelog. Removed AggregateRating structured-data markup (policy compliance).
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">v1.0</td>
                  <td className="px-4 py-3 text-muted-foreground">June 2025</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Initial methodology. Weights: Growth Momentum 45%, Ranking Momentum 35%, Price
                    Stability 20%. Saturating exponential growth curve, tanh rank curve, penalty-based
                    price stability.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Score reading guide */}
        <section className="mt-14" aria-labelledby="reading-heading">
          <h2 id="reading-heading" className="text-xl font-semibold">How to read a score</h2>
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
                  <td className="px-4 py-3 text-muted-foreground">Strong, sustained growth with a stable offer. The community is expanding and holding its position on the platform.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-semibold tabular-nums text-[oklch(0.6_0.13_60)]">45–69</td>
                  <td className="px-4 py-3 text-muted-foreground">Steady but unremarkable trajectory, or mixed signals, for example solid growth paired with recent price changes.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[oklch(0.55_0.18_25)]">0–44</td>
                  <td className="px-4 py-3 text-muted-foreground">Flat or declining membership, falling discovery rank, or unstable pricing over the observation window.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            A low TrustSkore does not mean a community is a scam. It means its recent public
            growth record is weak. New communities with little history tend to start in the middle
            of the range until they build a track record.
          </p>
        </section>

        {/* ── 9. Estimated Revenue ─────────────────────────────────────── */}
        <section className="mt-14" id="mrr" aria-labelledby="mrr-heading">
          <h2 id="mrr-heading" className="flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-5 w-5" /> 9. Estimated Revenue figures
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Some community pages show an <strong className="text-foreground">Estimated Revenue</strong> range.
            This figure is not a verified income claim. It is a model-based estimate derived from two
            independent signals: a <em>naive ceiling</em> and, when available, the creator's{" "}
            <em>public Skool revenue badge</em>.
          </p>

          <div className="mt-6 space-y-5">
            {/* Signal 1 */}
            <div className="rounded-[4px] border border-border bg-card p-5 text-sm">
              <p className="font-semibold">Signal 1: Naive ceiling (always available for paid communities)</p>
              <p className="mt-2 text-muted-foreground">
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">naive_ceiling = total_members × monthly_price</code>
              </p>
              <p className="mt-2 text-muted-foreground">
                This is the theoretical maximum if every current member pays the full monthly price with
                zero churn. In practice, actual MRR is lower due to annual plans, trials, churn, and
                refunds. We display it as an upper bound only.
              </p>
            </div>

            {/* Signal 2 */}
            <div className="rounded-[4px] border border-border bg-card p-5 text-sm">
              <p className="font-semibold">Signal 2: Skool public revenue badge (when available)</p>
              <p className="mt-2 text-muted-foreground">
                Skool displays a public badge on creator profiles when their total monthly revenue across
                all communities crosses a tier threshold. These tiers are publicly visible on Skool.com
                and are not set by TrustSkool.
              </p>
              <div className="mt-4 overflow-hidden rounded-[4px] border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/60 text-left">
                      <th className="px-3 py-2 font-semibold">Badge</th>
                      <th className="px-3 py-2 font-semibold">Tier range (MRR)</th>
                      <th className="px-3 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {[
                      ["Clover", "$3k – $10k / month", ""],
                      ["Liftoff / Rocket", "$10k – $30k / month", "Liftoff is an alias for the Rocket tier"],
                      ["Crown", "$30k – $100k / month", ""],
                      ["Diamond", "$100k – $300k / month", ""],
                      ["Red Diamond", "$300k – $1M / month", ""],
                      ["Goated / Goat", "$1M+ / month", "Open-ended upper bound"],
                    ].map(([badge, range, note]) => (
                      <tr key={badge}>
                        <td className="px-3 py-2 font-medium">{badge}</td>
                        <td className="px-3 py-2 text-muted-foreground tabular-nums">{range}</td>
                        <td className="px-3 py-2 text-muted-foreground">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Combination logic */}
            <div className="rounded-[4px] border border-border bg-card p-5 text-sm">
              <p className="font-semibold">How the two signals are combined</p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">No badge + paid community:</strong> Display naive ceiling as "Up to $X/month" with no reinforcement label.</li>
                <li><strong className="text-foreground">Badge + single community:</strong> Intersect the tier range with the naive ceiling. If the naive ceiling is inside the tier, the intersection narrows the range. If the naive ceiling is below the tier's lower bound, the full tier range is shown with a note that the badge suggests higher revenue than the ceiling implies.</li>
                <li><strong className="text-foreground">Badge + multiple communities:</strong> The badge covers the creator's total across all their communities. We allocate the tier range proportionally by member count across the communities we have indexed. This is an approximation: the actual split depends on price and churn per community.</li>
                <li><strong className="text-foreground">Free community + no badge:</strong> No estimate is shown.</li>
              </ul>
            </div>

            {/* Caveats */}
            <div className="rounded-[4px] border border-border bg-secondary/40 p-5 text-sm">
              <p className="font-semibold">Important caveats</p>
              <ul className="mt-3 space-y-1.5 text-muted-foreground">
                <li>Revenue estimates are not verified by Skool or the community creator.</li>
                <li>Skool badges reflect total creator MRR, not individual community MRR.</li>
                <li>Naive ceilings assume 100% conversion and zero churn. Actual MRR is always lower.</li>
                <li>The estimate is updated whenever the community's member count or price changes in our index.</li>
                <li>TrustSkool does not earn more commission from communities with higher revenue estimates.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA row */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[4px] border border-foreground bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.97]">
            Browse the rankings
          </Link>
          <Link
            href="/policy/fraud-response"
            className="inline-flex h-11 items-center rounded-[4px] border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-foreground">
            Fraud response policy
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
