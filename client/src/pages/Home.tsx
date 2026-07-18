import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import CommunityCard from "@/components/CommunityCard";
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatCategory } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { useDatafast } from "@/hooks/useDatafast";

type SortKey = "trustSkore" | "totalMembers" | "growthRateBp" | "category";
type PriceKey = "all" | "free" | "paid";

const SORT_OPTIONS: { key: SortKey; label: string; shortLabel: string }[] = [
  { key: "trustSkore", label: "TrustSkore", shortLabel: "Score" },
  { key: "totalMembers", label: "Members", shortLabel: "Members" },
  { key: "growthRateBp", label: "Growth", shortLabel: "Growth" },
];

const PAGE_SIZE = 24;

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-base font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}

/** Compact searchable language dropdown */
function LanguageDropdown({
  languages,
  value,
  onChange,
}: {
  languages: { value: string; count?: number }[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? languages.filter(l => l.value.toLowerCase().includes(q)) : languages;
  }, [languages, search]);

  const label = value ? capitalize(value) : "Language";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className={`chip inline-flex items-center gap-1.5 ${value ? "data-[active=true]" : ""}`}
        data-active={Boolean(value)}>
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-[4px] border border-border bg-background shadow-md">
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 w-full rounded-[4px] border border-input bg-card pl-8 pr-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {/* All option */}
            {!search && (
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${!value ? "font-semibold" : ""}`}>
                All languages
              </button>
            )}
            {filtered.map(lang => (
              <button
                key={lang.value}
                type="button"
                onClick={() => { onChange(lang.value); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${value === lang.value ? "bg-[#F8D481]/20 font-semibold" : ""}`}>
                <span>{capitalize(lang.value)}</span>
                {lang.count && (
                  <span className="ml-2 text-xs text-muted-foreground tabular-nums">{lang.count >= 1000 ? `${Math.round(lang.count / 1000)}k+` : lang.count}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">No languages found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FiltersBar ──────────────────────────────────────────────────────────────

type FiltersBarProps = {
  price: PriceKey;
  language: string | undefined;
  sort: SortKey;
  direction: "asc" | "desc";
  languages: { value: string; count?: number }[];
  stats: { freeCommunities: number; totalCommunities: number; trendingCommunities: number } | undefined;
  hasActiveFilters: boolean;
  isLoading: boolean;
  total: number | undefined;
  fmtK: (n: number) => string;
  onPrice: (v: PriceKey) => void;
  onLanguage: (v: string | undefined) => void;
  onSort: (key: SortKey) => void;
  onClear: () => void;
};

function FiltersBar({
  price, language, sort, direction, languages, stats, hasActiveFilters,
  isLoading, total, fmtK, onPrice, onLanguage, onSort, onClear,
}: FiltersBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close filters dropdown on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  const activeFilterCount = (price !== "all" ? 1 : 0) + (language ? 1 : 0);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Single row: Filters dropdown + Sort buttons + Clear */}
      <div className="flex items-center gap-1.5">

        {/* Filters dropdown trigger */}
        <div ref={filtersRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            className={`chip inline-flex items-center gap-1.5 ${
              activeFilterCount > 0 ? "" : ""
            }`}
            data-active={activeFilterCount > 0}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown panel */}
          {filtersOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[4px] border border-border bg-background shadow-md">
              {/* Price section */}
              <div className="border-b border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</p>
                <div className="flex flex-col gap-1">
                  {(["all", "free", "paid"] as PriceKey[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { onPrice(p); }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                        price === p ? "bg-[#F8D481]/20 font-semibold" : ""
                      }`}>
                      <span>{p === "all" ? "All prices" : p === "free" ? "Free" : "Paid"}</span>
                      {p === "free" && stats && (
                        <span className="text-xs text-muted-foreground tabular-nums">{fmtK(stats.freeCommunities)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language section */}
              {languages.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</p>
                  <LanguageDropdown
                    languages={languages}
                    value={language}
                    onChange={v => { onLanguage(v); }}
                  />
                </div>
              )}

              {/* Clear inside dropdown */}
              {activeFilterCount > 0 && (
                <div className="border-t border-border p-2">
                  <button
                    type="button"
                    onClick={() => { onClear(); setFiltersOpen(false); }}
                    className="w-full rounded px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sort buttons */}
        <div className="flex flex-1 items-center gap-1" role="group" aria-label="Sort by">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSort(opt.key)}
              aria-pressed={sort === opt.key}
              className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[4px] border px-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-2.5 ${
                sort === opt.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground"
              }`}>
              <span className="sm:hidden">{opt.shortLabel}</span>
              <span className="hidden sm:inline">{opt.label}</span>
              {sort === opt.key &&
                (direction === "desc" ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                ))}
            </button>
          ))}
        </div>

        {/* Clear button outside dropdown (when no dropdown open) */}
        {hasActiveFilters && !filtersOpen && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Community count */}
      <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
        {isLoading && total === undefined
          ? "Loading…"
          : total !== undefined
            ? `${total.toLocaleString("en-US")} communities`
            : ""}
      </p>
    </div>
  );
}

export default function Home() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const urlQuery = useMemo(() => new URLSearchParams(searchString).get("q") ?? "", [searchString]);

  const [search, setSearch] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  const [language, setLanguage] = useState<string | undefined>("english");
  const [price, setPrice] = useState<PriceKey>("all");
  const [sort, setSort] = useState<SortKey>("trustSkore");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // sync with top-nav search
  useEffect(() => {
    setSearch(urlQuery);
    setDebounced(urlQuery);
    setPage(1);
  }, [urlQuery]);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const listInput = useMemo(
    () => ({
      search: debounced || undefined,
      language,
      price,
      sort,
      direction,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debounced, language, price, sort, direction, page],
  );

  const { data, isLoading } = trpc.communities.list.useQuery(listInput, {
    placeholderData: prev => prev,
  });
  const { data: filters } = trpc.communities.filters.useQuery();
  const { data: stats } = trpc.communities.stats.useQuery();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Always sort descending when switching column; toggle direction only when same column
  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDirection(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setDirection("desc"); // always reset to desc on column change
    }
    setPage(1);
  };

  const setFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setDebounced("");
    setLanguage(undefined);
    setPrice("all");
    setSort("trustSkore");
    setDirection("desc");
    setPage(1);
    navigate("/");
  };

  const hasActiveFilters = Boolean(debounced || language || price !== "all");

  const { track } = useDatafast();

  // Track search_used goal (debounced, min 3 chars, fires once per distinct query)
  const lastTrackedQuery = useRef("");
  useEffect(() => {
    if (debounced.length >= 3 && debounced !== lastTrackedQuery.current) {
      lastTrackedQuery.current = debounced;
      track("search_used", { query: debounced.slice(0, 50) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // All languages shown in Skool's canonical order (ordered server-side)
  const languages = filters?.languages ?? [];

  // Format stat numbers: exact number with locale formatting (e.g. 22,502)
  // Use fixed 'en-US' locale to prevent SSR/client hydration mismatch
  const fmtK = (n: number) => n.toLocaleString("en-US");

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="container py-6 md:py-12">
          {/* Two-column layout on desktop: headline left, stats right */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[24px] font-bold leading-tight tracking-tight text-balance sm:text-[28px] md:text-[42px]">
                Find Skool communities worth joining, before you pay.
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Every community gets a <strong className="font-semibold text-foreground">TrustSkore</strong> built from
                member growth, rank momentum and price stability.
                {" "}<span className="hidden sm:inline">No paid placements, no sponsored rankings.</span>
              </p>
            </div>

            {/* Social proof stat pills — right-aligned on desktop */}
            {stats && (
              <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 md:flex-col md:items-end md:gap-y-1.5">
                <StatPill value={fmtK(stats.totalCommunities)} label="communities indexed" />
                <StatPill value={fmtK(stats.freeCommunities)} label="free to join" />
                {stats.trendingCommunities > 0 && (
                  <StatPill value={fmtK(stats.trendingCommunities)} label="growing this month" />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-5 sm:py-8">
        {/* Filter + sort bar */}
        <FiltersBar
          price={price}
          language={language}
          sort={sort}
          direction={direction}
          languages={languages}
          stats={stats}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          total={data?.total}
          fmtK={fmtK}
          onPrice={v => setFilter(() => setPrice(v))}
          onLanguage={v => setFilter(() => setLanguage(v))}
          onSort={toggleSort}
          onClear={clearAllFilters}
        />

        {/* Leaderboard */}
        <div className="mt-3 rounded-[4px] border border-border">
          {isLoading && !data ? (
            <div className="flex flex-col gap-px p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-[4px]" />
                </div>
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((community, i) => (
              <CommunityCard
                key={community.slug}
                community={community}
                rank={(page - 1) * PAGE_SIZE + i + 1}
              />
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-base font-medium">No communities match your filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search term or remove a filter.
              </p>
              <button
                type="button"
                className="chip mt-4"
                onClick={clearAllFilters}>
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-border bg-card px-4 text-sm font-medium disabled:opacity-40 transition-colors hover:border-foreground active:scale-[0.97]">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="px-2 text-sm text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-border bg-card px-4 text-sm font-medium disabled:opacity-40 transition-colors hover:border-foreground active:scale-[0.97]">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}

        {/* Secondary CTA banner */}
        <aside className="mt-12 rounded-[4px] border border-foreground bg-foreground px-6 py-10 text-background md:px-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-background md:text-2xl">
                Launch your Business on Skool
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-background/70 md:text-base">
                Community, courses and events under one roof. Starts at $9/month. Build the growth record that earns a TrustSkore.
              </p>
            </div>
            <a
              href="/go/signup"
              target="_blank" rel="sponsored noopener noreferrer"
              data-fast-goal="skool_click"
              data-fast-goal-source="home_banner"
              className="inline-flex h-11 shrink-0 items-center rounded-[4px] bg-[#F8D481] px-6 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
              Create your Community
            </a>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
