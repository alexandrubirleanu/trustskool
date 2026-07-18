import {
  CheckCircle2,
  Circle,
  Loader2,
  LogOut,
  MousePointerClick,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

/**
 * /admin — owner-only panel protected by email OTP.
 * Replaces /admin/clicks with a standalone auth gate.
 */

const FETCH_LIMIT = 1000;
const PAGE_SIZE = 50;

function formatTs(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── OTP Gate ────────────────────────────────────────────────────────────────

function OtpGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const requestOtp = trpc.adminOtp.requestOtp.useMutation({
    onSuccess: result => {
      if (result.sent) {
        setCodeSent(true);
        setError(null);
        setTimeout(() => codeRef.current?.focus(), 100);
      } else {
        // Don't reveal the allowlist — show generic message
        setError("Check your inbox for the code.");
        setCodeSent(true);
      }
    },
    onError: err => setError(err.message),
  });

  const verifyOtp = trpc.adminOtp.verifyOtp.useMutation({
    onSuccess: () => {
      onAuthenticated();
    },
    onError: err => {
      setError(err.message);
      setCode("");
    },
  });

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    requestOtp.mutate({ email: email.trim() });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    verifyOtp.mutate({ email: email.trim(), code: code.trim() });
  }

  return (
    <SiteLayout>
      <div className="container flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Admin access</h1>
              <p className="text-sm text-muted-foreground">TrustSkool owner panel</p>
            </div>
          </div>

          {!codeSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={requestOtp.isPending || !email.trim()}>
                {requestOtp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send one-time code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to <strong>{email}</strong>. Enter it below.
              </p>
              <div>
                <label htmlFor="admin-code" className="mb-1.5 block text-sm font-medium">
                  One-time code
                </label>
                <Input
                  id="admin-code"
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  className="tracking-widest text-center text-lg font-bold"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtp.isPending || code.length !== 6}>
                {verifyOtp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify code"
                )}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setError(null);
                }}>
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = trpc.admin.clickStats.useQuery();
  const { data: clicks, isLoading: clicksLoading } = trpc.admin.clicks.useQuery(
    { limit: FETCH_LIMIT },
    { placeholderData: prev => prev },
  );
  const { data: lastIngestion } = trpc.admin.lastIngestion.useQuery();
  const { data: ownerProfiles } = trpc.ownerProfiles.list.useQuery();
  const [aflSort, setAflSort] = useState<"afl" | "clicks">("afl");
  const aflRows = useMemo(() => {
    if (!ownerProfiles) return [];
    const rows: { slug: string; displayName: string; aflPercent: number | null; handle: string }[] = [];
    for (const profile of ownerProfiles) {
      for (const c of profile.ownedCommunities ?? []) {
        if (c.afl_percent != null && c.afl_percent > 0) {
          rows.push({ slug: c.slug, displayName: c.display_name, aflPercent: c.afl_percent, handle: profile.handle });
        }
      }
    }
    if (aflSort === "afl") return rows.sort((a, b) => (b.aflPercent ?? 0) - (a.aflPercent ?? 0));
    const clickMap = new Map(stats?.map(s => [s.slug, Number(s.count)]) ?? []);
    return rows.sort((a, b) => (clickMap.get(b.slug) ?? 0) - (clickMap.get(a.slug) ?? 0));
  }, [ownerProfiles, aflSort, stats]);

  const utils = trpc.useUtils();

  const provisionDigest = trpc.admin.provisionDigestJob.useMutation({
    onSuccess: result => {
      if (result.created) {
        toast.success(`Daily digest cron activated (next run: ${result.nextExecutionAt ?? "09:00 UTC"})`);
      } else {
        toast.info("Daily digest cron is already active.");
      }
    },
    onError: err => toast.error(`Digest activation failed: ${err.message}`),
  });

  const { data: opportunityView, isLoading: oppLoading } = trpc.admin.opportunityView.useQuery();
  const [oppSort, setOppSort] = useState<"clicks" | "afl" | "trustSkore">("clicks");
  const [showJoined, setShowJoined] = useState(false);

  const sortedOpp = useMemo(() => {
    if (!opportunityView) return [];
    let rows = showJoined ? opportunityView : opportunityView.filter((r: typeof opportunityView[0]) => !r.ownerJoined);
    if (oppSort === "clicks") rows = [...rows].sort((a, b) => Number(b.clickCount) - Number(a.clickCount));
    else if (oppSort === "afl") rows = [...rows].sort((a, b) => (b.aflPercent ?? 0) - (a.aflPercent ?? 0));
    else rows = [...rows].sort((a, b) => (b.trustSkore ?? 0) - (a.trustSkore ?? 0));
    return rows;
  }, [opportunityView, oppSort, showJoined]);

  const toggleOwnerJoined = trpc.admin.toggleOwnerJoined.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(vars.joined ? `Marked as joined: ${vars.slug}` : `Unmarked: ${vars.slug}`);
      utils.admin.opportunityView.invalidate();
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const { data: scheduledJobs } = trpc.admin.listScheduledJobs.useQuery();
  const digestActive = scheduledJobs?.jobs?.some((j: { name: string }) => j.name === "daily-digest") ?? false;

  const runIngestion = trpc.admin.runIngestion.useMutation({
    onSuccess: result => {
      if (result.ok) {
        toast.success(`Ingestion complete: ${result.upserted}/${result.total} communities updated`);
      } else {
        toast.error(`Ingestion failed: ${result.errors[0] ?? "unknown error"}`);
      }
      utils.admin.lastIngestion.invalidate();
      utils.communities.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const logoutMutation = trpc.adminOtp.logout.useMutation({
    onSuccess: () => onLogout(),
  });

  const totalClicks = stats?.reduce((sum, s) => sum + Number(s.count), 0) ?? 0;
  const totalPages = clicks ? Math.max(1, Math.ceil(clicks.length / PAGE_SIZE)) : 1;
  const pageItems = clicks?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  return (
    <SiteLayout>
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Outbound clicks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalClicks} tracked clicks
              {lastIngestion?.createdAt &&
                ` · last data refresh ${formatTs(lastIngestion.createdAt)}`}
              {" · "}
              <span className="text-xs text-muted-foreground">{email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-card"
              disabled={digestActive || provisionDigest.isPending}
              onClick={() => provisionDigest.mutate()}>
              {provisionDigest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : digestActive ? (
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              ) : (
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              )}
              {digestActive ? "Digest active (09:00 UTC)" : "Activate daily digest"}
            </Button>
            <Button
              variant="outline"
              className="bg-card"
              disabled={runIngestion.isPending}
              onClick={() => runIngestion.mutate()}>
              {runIngestion.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run ingestion now
            </Button>
            <Button
              variant="outline"
              className="bg-card"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Per-community counts */}
        <section className="mt-8" aria-labelledby="counts-heading">
          <h2 id="counts-heading" className="text-lg font-semibold">
            Clicks by community
          </h2>
          {statsLoading ? (
            <div className="mt-4 flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : stats && stats.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(s => (
                <div key={s.slug} className="rounded-[4px] border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{s.displayName}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums">
                      <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                      {Number(s.count)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">/{s.slug}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-[4px] border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No clicks tracked yet.
            </p>
          )}
        </section>

        {/* Full click log */}
        <section className="mt-10" aria-labelledby="log-heading">
          <h2 id="log-heading" className="text-lg font-semibold">
            Click log
          </h2>
          <div className="mt-4 overflow-x-auto rounded-[4px] border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Community</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicksLoading && !clicks ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : pageItems.length > 0 ? (
                  pageItems.map(click => (
                    <TableRow key={click.id}>
                      <TableCell className="font-medium">{click.displayName}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatTs(click.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">
                        {click.referrer || <span className="italic">direct / none</span>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      No clicks recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Click log pagination">
              <Button variant="outline" size="sm" className="bg-card" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Prev
              </Button>
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" className="bg-card" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </nav>
          )}
        </section>

        {/* Opportunity view */}
        <section className="mt-10" aria-labelledby="opp-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="opp-heading" className="flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                Opportunity view
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Communities with affiliate commission. Toggle "Joined" once you've activated the affiliate link.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort</span>
              {(["clicks", "afl", "trustSkore"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setOppSort(s)}
                  className={`rounded px-2 py-1 font-medium transition-colors ${
                    oppSort === s ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>
                  {s === "clicks" ? "Clicks" : s === "afl" ? "Afl %" : "TrustSkore"}
                </button>
              ))}
              <button
                onClick={() => setShowJoined(v => !v)}
                className={`rounded px-2 py-1 font-medium transition-colors ${
                  showJoined ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                {showJoined ? "Hide joined" : "Show joined"}
              </button>
            </div>
          </div>

          {oppLoading ? (
            <div className="mt-4 flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sortedOpp.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-[4px] border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">TrustSkore</TableHead>
                    <TableHead className="text-right">Afl %</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOpp.map((row: typeof sortedOpp[0]) => (
                    <TableRow key={row.slug}>
                      <TableCell>
                        <div className="font-medium">{row.displayName}</div>
                        <div className="text-xs text-muted-foreground">/{row.slug}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{Number(row.clickCount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.trustSkore?.toFixed(1) ?? "·"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.aflPercent != null ? `${row.aflPercent}%` : "·"}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => toggleOwnerJoined.mutate({ slug: row.slug, joined: !row.ownerJoined })}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                          {row.ownerJoined ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="mt-4 rounded-[4px] border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No affiliate communities found yet.
            </p>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function Admin() {
  const { data: session, isLoading, refetch } = trpc.adminOtp.checkSession.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [justAuthenticated, setJustAuthenticated] = useState(false);

  function handleAuthenticated() {
    setJustAuthenticated(true);
    refetch();
  }

  function handleLogout() {
    refetch();
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container flex justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!session?.authenticated) {
    return <OtpGate onAuthenticated={handleAuthenticated} />;
  }

  return <AdminDashboard email={session.email ?? ""} onLogout={handleLogout} />;
}
