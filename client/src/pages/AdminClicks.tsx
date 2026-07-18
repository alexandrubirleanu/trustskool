import { Loader2, MousePointerClick, RefreshCw, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

/**
 * /admin/clicks — owner-only view of tracked outbound clicks.
 * Shows per-community click counts (most clicked first) and the full click log.
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

export default function AdminClicks() {
  const { user, loading, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = trpc.admin.clickStats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: clicks, isLoading: clicksLoading } = trpc.admin.clicks.useQuery(
    { limit: FETCH_LIMIT },
    { enabled: isAdmin, placeholderData: prev => prev },
  );
  const { data: lastIngestion } = trpc.admin.lastIngestion.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Owner profiles with afl_percent — internal-only affiliate signal
  const { data: ownerProfiles } = trpc.ownerProfiles.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Flatten to per-community afl_percent rows, sorted by afl_percent desc
  const [aflSort, setAflSort] = useState<"afl" | "clicks">("afl");
  const aflRows = useMemo(() => {
    if (!ownerProfiles) return [];
    const rows: { slug: string; displayName: string; aflPercent: number | null; handle: string }[] = [];
    for (const profile of ownerProfiles) {
      for (const c of profile.ownedCommunities ?? []) {
        if (c.afl_percent != null && c.afl_percent > 0) {
          rows.push({
            slug: c.slug,
            displayName: c.display_name,
            aflPercent: c.afl_percent,
            handle: profile.handle,
          });
        }
      }
    }
    if (aflSort === "afl") return rows.sort((a, b) => (b.aflPercent ?? 0) - (a.aflPercent ?? 0));
    // sort by click count
    const clickMap = new Map(stats?.map(s => [s.slug, Number(s.count)]) ?? []);
    return rows.sort((a, b) => (clickMap.get(b.slug) ?? 0) - (clickMap.get(a.slug) ?? 0));
  }, [ownerProfiles, aflSort, stats]);

  const utils = trpc.useUtils();
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

  if (loading) {
    return (
      <SiteLayout>
        <div className="container flex justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="container max-w-md py-24 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Admin area</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page is restricted to the TrustSkool owner.
            {isAuthenticated
              ? " Your account does not have admin access."
              : " Sign in with the owner account to continue."}
          </p>
          {!isAuthenticated && (
            <Button className="mt-6" onClick={() => startLogin()}>
              Sign in
            </Button>
          )}
        </div>
      </SiteLayout>
    );
  }

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
            </p>
          </div>
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
              No clicks tracked yet. Counts will appear as soon as visitors use the outbound
              buttons.
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
              <Button
                variant="outline"
                size="sm"
                className="bg-card"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>
                Prev
              </Button>
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="bg-card"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </nav>
          )}
        </section>
        {/* Affiliate commission — internal only */}
        <section className="mt-10" aria-labelledby="afl-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="afl-heading" className="text-lg font-semibold">Affiliate commission rates</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Internal signal only — owner-set affiliate % from scraped profiles. Not shown publicly.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort by</span>
              <button
                onClick={() => setAflSort("afl")}
                className={`rounded px-2 py-1 font-medium transition-colors ${
                  aflSort === "afl" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                Commission %
              </button>
              <button
                onClick={() => setAflSort("clicks")}
                className={`rounded px-2 py-1 font-medium transition-colors ${
                  aflSort === "clicks" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                Clicks
              </button>
            </div>
          </div>
          {aflRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-[4px] border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Owner handle</TableHead>
                    <TableHead className="text-right">Afl %</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aflRows.map(row => {
                    const clickCount = stats?.find(s => s.slug === row.slug);
                    return (
                      <TableRow key={row.slug}>
                        <TableCell>
                          <div className="font-medium">{row.displayName}</div>
                          <div className="text-xs text-muted-foreground">/{row.slug}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">@{row.handle}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center justify-end gap-1 font-bold tabular-nums">
                            {row.aflPercent}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {clickCount ? Number(clickCount.count) : <span className="italic">0</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="mt-4 rounded-[4px] border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No affiliate commission data yet. Import owner profiles to populate this table.
            </p>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
