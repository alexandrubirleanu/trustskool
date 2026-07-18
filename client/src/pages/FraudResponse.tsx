import { AlertTriangle, Ban, Flag, Mail, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SiteLayout from "@/components/SiteLayout";

/**
 * Fraud & Scam Response Policy page.
 * URL: /policy/fraud-response
 *
 * General-purpose policy. Does NOT include trading/finance-specific disclaimers
 * (pending a separate risk decision from the site owner).
 */

export default function FraudResponse() {
  return (
    <SiteLayout>
      <div className="container max-w-3xl py-12 md:py-16">
        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Policy · v1.0 · July 2025
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-[40px] md:leading-tight">
          Fraud & Scam Response Policy
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          TrustSkool is an independent directory. We do not vet communities before indexing them,
          and a high TrustSkore is not a guarantee of safety or legitimacy. This page explains what
          we do when credible fraud or scam reports reach us.
        </p>

        <DisclaimerBanner
          level="info"
          message="This is a general-purpose policy covering all community categories. Niche-specific risk frameworks (e.g. financial advice, health claims) may be added in future versions."
          className="mt-6"
        />

        {/* Section 1: Scope */}
        <section className="mt-12" id="scope" aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="text-xl font-semibold">What this policy covers</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This policy applies to any Skool community listed in the TrustSkool index. It governs
            how TrustSkool responds to reports of fraud, scams, deceptive marketing, or other
            credible harm — not to content quality disputes, refund disagreements between members
            and creators, or low TrustSkore complaints.
          </p>
        </section>

        {/* Section 2: Delisting criteria */}
        <section className="mt-12" id="delisting" aria-labelledby="delisting-heading">
          <h2 id="delisting-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Ban className="h-5 w-5" /> Delisting criteria
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            TrustSkool will remove a community from the index, or flag it with a visible warning
            label, if one or more of the following conditions are met:
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              {
                title: "Credible fraud or scam reports",
                body: "Multiple independent, verifiable reports of fraudulent activity — such as taking payment without delivering promised access, impersonating another creator, or running a Ponzi-style referral scheme — constitute grounds for immediate flagging and review for delisting.",
              },
              {
                title: "Sustained community shutdown",
                body: "A community that has been closed, archived or made inaccessible to members for more than 30 consecutive days will be flagged as inactive and removed from active rankings.",
              },
              {
                title: "Confirmed deceptive pricing",
                body: "Evidence that the publicly displayed price does not match what members are actually charged, or that a 'free' label is used to attract members who are then subjected to aggressive upsells without prior disclosure.",
              },
              {
                title: "Legal order or platform action",
                body: "A court order, regulatory action, or confirmed removal by Skool.com for policy violations will result in immediate delisting.",
              },
            ].map(item => (
              <div key={item.title} className="rounded-[4px] border border-border bg-card p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1.5 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Warning label */}
        <section className="mt-12" id="warning-label" aria-labelledby="warning-heading">
          <h2 id="warning-heading" className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Warning label
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Communities under active review — where reports have been received but not yet verified
            — will display a visible caution banner on their TrustSkool page. Example:
          </p>
          <div className="mt-4">
            <DisclaimerBanner
              level="caution"
              message="This community is currently under review following credible reports. TrustSkool has not verified these reports. Exercise caution before joining."
              cta={{ label: "Fraud policy", href: "/policy/fraud-response" }}
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If reports are verified and the community meets delisting criteria, the caution banner
            is replaced with a warning banner and the community is removed from rankings:
          </p>
          <div className="mt-4">
            <DisclaimerBanner
              level="warning"
              message="This community has been flagged following verified fraud reports and removed from active rankings. Its affiliate link has been suspended."
              cta={{ label: "Fraud policy", href: "/policy/fraud-response" }}
            />
          </div>
        </section>

        {/* Section 4: Commission suspension */}
        <section className="mt-12" id="commission" aria-labelledby="commission-heading">
          <h2 id="commission-heading" className="flex items-center gap-2 text-xl font-semibold">
            <ShieldAlert className="h-5 w-5" /> Commission suspension rule
          </h2>
          <div className="mt-5 rounded-[4px] border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            <p>
              When a community is flagged under this policy — whether at the caution or warning
              level — TrustSkool immediately suspends the affiliate link for that community.
            </p>
            <p className="mt-3">
              This means TrustSkool stops earning any commission from that community while it is
              under review. The affiliate link is not reinstated until the review is resolved and
              the flag is lifted.
            </p>
            <p className="mt-3">
              This rule exists to ensure that TrustSkool has no financial incentive to delay or
              avoid acting on credible fraud reports.
            </p>
          </div>
        </section>

        {/* Section 5: How to report */}
        <section className="mt-12" id="report" aria-labelledby="report-heading">
          <h2 id="report-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Flag className="h-5 w-5" /> How to submit a report
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            To report a community, send an email to{" "}
            <a
              href="mailto:reports@trustskool.com"
              className="font-medium text-foreground underline underline-offset-2">
              reports@trustskool.com
            </a>{" "}
            with the following information:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="mt-0.5 shrink-0 font-semibold text-foreground">1.</span> The community name and its URL on Skool.com</li>
            <li className="flex gap-2"><span className="mt-0.5 shrink-0 font-semibold text-foreground">2.</span> A description of the alleged fraud or harm</li>
            <li className="flex gap-2"><span className="mt-0.5 shrink-0 font-semibold text-foreground">3.</span> Any supporting evidence (screenshots, receipts, correspondence)</li>
            <li className="flex gap-2"><span className="mt-0.5 shrink-0 font-semibold text-foreground">4.</span> Your contact email (kept confidential, used only to follow up)</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            We aim to acknowledge reports within 5 business days and complete initial review within
            15 business days. Complex cases may take longer.
          </p>
        </section>

        {/* Section 6: Review process */}
        <section className="mt-12" id="process" aria-labelledby="process-heading">
          <h2 id="process-heading" className="flex items-center gap-2 text-xl font-semibold">
            <RefreshCw className="h-5 w-5" /> Review process
          </h2>
          <div className="mt-5 space-y-3 text-sm">
            {[
              { step: "1", label: "Report received", body: "We log the report and send an acknowledgement. The affiliate link for the reported community is suspended immediately." },
              { step: "2", label: "Initial assessment", body: "We review the evidence provided and cross-reference with publicly available information. If the report appears credible, the community is flagged with a caution banner on TrustSkool." },
              { step: "3", label: "Verification", body: "We attempt to verify the reported harm through independent sources. We may contact the community creator for a response." },
              { step: "4", label: "Decision", body: "If the report is verified, the community is delisted and the warning banner is applied. If the report is not substantiated, the caution flag is removed and the affiliate link is reinstated. The reporter is notified of the outcome." },
            ].map(item => (
              <div key={item.step} className="flex gap-4 rounded-[4px] border border-border bg-card p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{item.step}</span>
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Limitations */}
        <section className="mt-12" id="limitations" aria-labelledby="policy-limits-heading">
          <h2 id="policy-limits-heading" className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="h-5 w-5" /> What this policy does not cover
          </h2>
          <div className="mt-5 rounded-[4px] border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>TrustSkool is a directory, not a regulator or dispute resolution service. This policy does not cover:</p>
            <ul className="space-y-2">
              <li><strong className="text-foreground">Refund disputes</strong> between members and community creators — contact Skool.com support or your payment provider.</li>
              <li><strong className="text-foreground">Content quality complaints</strong> — whether a course is "worth it" is subjective and outside our scope.</li>
              <li><strong className="text-foreground">Low TrustSkore complaints</strong> — the score is algorithmic; see the methodology page for how to interpret it.</li>
              <li><strong className="text-foreground">Legal advice</strong> — if you believe you have been defrauded, consult a legal professional or your local consumer protection authority.</li>
            </ul>
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
            href="/methodology"
            className="inline-flex h-11 items-center rounded-[4px] border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-foreground">
            Methodology
          </Link>
          <a
            href="mailto:reports@trustskool.com"
            className="inline-flex h-11 items-center gap-2 rounded-[4px] border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-foreground">
            <Mail className="h-4 w-4" /> Report a community
          </a>
        </div>
      </div>
    </SiteLayout>
  );
}
