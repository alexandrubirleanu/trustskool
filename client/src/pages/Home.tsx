import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import CommunityCard from "@/components/CommunityCard";
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatCategory } from "@/lib/format";
import { SKOOL_CATEGORIES } from "@shared/appConfig";
import { trpc } from "@/lib/trpc";
import { useDatafast } from "@/hooks/useDatafast";
import LiveActivityToast from "@/components/LiveActivityToast";

type SortKey = "trustSkore" | "totalMembers" | "growthRateBp" | "category";
type PriceKey = "all" | "free" | "paid";

const SORT_OPTIONS: { key: SortKey; label: string; shortLabel: string }[] = [
  { key: "trustSkore", label: "TrustSkore", shortLabel: "Skore" },
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

// ─── CategoryDropdown ───────────────────────────────────────────────────────
/** Compact searchable category dropdown — mirrors LanguageDropdown */
function CategoryDropdown({
  categories,
  value,
  onChange,
  stats,
  fmtK,
}: {
  categories: { value: string; count?: number }[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  stats: { totalCommunities: number } | undefined;
  fmtK: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

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
    return q
      ? SKOOL_CATEGORIES.filter(c => c.label.toLowerCase().includes(q) || c.slug.includes(q))
      : SKOOL_CATEGORIES;
  }, [search]);

  const selectedCat = value ? SKOOL_CATEGORIES.find(c => c.slug === value) : undefined;
  const label = selectedCat ? `${selectedCat.emoji} ${selectedCat.label}` : "Category";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="chip inline-flex items-center gap-1.5"
        data-active={Boolean(value)}>
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[4px] border border-border bg-background shadow-md">
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
          <div className="max-h-60 overflow-y-auto py-1">
            {!search && (
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${!value ? "font-semibold" : ""}`}>
                <span>All categories</span>
                {stats && (
                  <span className="ml-2 text-xs text-muted-foreground tabular-nums">{fmtK(stats.totalCommunities)}</span>
                )}
              </button>
            )}
            {filtered.map(cat => {
              const dbCat = categories.find(c => c.value === cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => { onChange(cat.slug); setOpen(false); setSearch(""); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${value === cat.slug ? "bg-[#F8D481]/20 font-semibold" : ""}`}>
                  <span>{cat.emoji} {cat.label}</span>
                  {dbCat?.count != null && (
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      {dbCat.count >= 1000 ? `${Math.round(dbCat.count / 1000)}k+` : dbCat.count}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">No categories found.</p>
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
  category: string | undefined;
  mrrVerified: boolean;
  sort: SortKey;
  direction: "asc" | "desc";
  languages: { value: string; count?: number }[];
  categories: { value: string; count?: number }[];
  stats: { freeCommunities: number; paidCommunities?: number; totalCommunities: number; trendingCommunities: number } | undefined;
  hasActiveFilters: boolean;
  isLoading: boolean;
  total: number | undefined;
  fmtK: (n: number) => string;
  onPrice: (v: PriceKey) => void;
  onLanguage: (v: string | undefined) => void;
  onCategory: (v: string | undefined) => void;
  onMrrVerified: (v: boolean) => void;
  onSort: (key: SortKey) => void;
  onClear: () => void;
};

function FiltersBar({
  price, language, category, mrrVerified, sort, direction, languages, categories, stats, hasActiveFilters,
  isLoading, total, fmtK, onPrice, onLanguage, onCategory, onMrrVerified, onSort, onClear,
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

  const activeFilterCount = (price !== "all" ? 1 : 0) + (language ? 1 : 0) + (category ? 1 : 0) + (mrrVerified ? 1 : 0);

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

          {/* Dropdown panel — compact grid layout */}
          {filtersOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-[4px] border border-border bg-background shadow-md">

              {/* Price + Category in a 2-col grid */}
              <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
                {/* Price */}
                <div className="bg-background p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</p>
                  <select
                    value={price}
                    onChange={e => onPrice(e.target.value as PriceKey)}
                    className="h-8 w-full rounded-[4px] border border-input bg-card px-2 text-sm outline-none focus:border-foreground cursor-pointer">
                    <option value="all">All{stats ? ` (${fmtK(stats.totalCommunities)})` : ""}</option>
                    <option value="free">Free{stats ? ` (${fmtK(stats.freeCommunities)})` : ""}</option>
                    <option value="paid">Paid{stats?.paidCommunities != null ? ` (${fmtK(stats.paidCommunities)})` : ""}</option>
                  </select>
                </div>
                {/* Revenue verified toggle */}
                <div className="bg-background p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue</p>
                  <button
                    type="button"
                    onClick={() => onMrrVerified(!mrrVerified)}
                    className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-[4px] border text-xs font-medium transition-colors ${
                      mrrVerified
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground"
                    }`}>
                    💰 Verified
                  </button>
                </div>
              </div>

              {/* Language */}
              {languages.length > 0 && (
                <div className="border-b border-border p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</p>
                  <LanguageDropdown
                    languages={languages}
                    value={language}
                    onChange={v => { onLanguage(v); }}
                  />
                </div>
              )}

              {/* Category */}
              <div className="border-b border-border p-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                <CategoryDropdown
                  categories={categories}
                  value={category}
                  onChange={v => { onCategory(v); }}
                  stats={stats}
                  fmtK={fmtK}
                />
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <div className="p-2">
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

      {/* Filtered count row — only shown when filters are active */}
      {hasActiveFilters && total != null && (
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Searching\u2026" : `${total.toLocaleString("en-US")} ${total === 1 ? "community" : "communities"} match your filters`}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  // Parse all filter state from URL params on every render (for SSR + deep links)
  const urlParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const urlQuery = useMemo(() => urlParams.get("q") ?? "", [urlParams]);

  const [search, setSearch] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  // Language filter logic:
  // - First visit: default to "english" (regardless of browser language)
  // - Return after 7+ days: reset to "english" (stale session)
  // - clearAllFilters: reset to "english" (not undefined)
  // - Within-session changes: respect user's explicit selection
  const LAST_VISIT_KEY = "ts_last_visit";
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const [language, setLanguage] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return "english";
    // If URL has ?lang=xxx, always honour it (shared/deep link)
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang) return urlLang;
    try {
      const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
      if (!lastVisit) {
        // First visit ever — default to english
        return "english";
      }
      const elapsed = Date.now() - parseInt(lastVisit, 10);
      if (elapsed > SEVEN_DAYS_MS) {
        // Returning after 7+ days — reset to english
        return "english";
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — default to english
    }
    return "english";
  });

  // Update lastVisit timestamp on every mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [price, setPrice] = useState<PriceKey>(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("price");
    return (p === "free" || p === "paid") ? p : "all";
  });
  const [category, setCategory] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("category") ?? undefined;
  });
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window === "undefined") return "trustSkore";
    const s = new URLSearchParams(window.location.search).get("sort");
    return (s === "totalMembers" || s === "growthRateBp") ? s : "trustSkore";
  });
  const [direction, setDirection] = useState<"asc" | "desc">(() => {
    if (typeof window === "undefined") return "desc";
    const d = new URLSearchParams(window.location.search).get("dir");
    return d === "asc" ? "asc" : "desc";
  });
  const [page, setPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const p = parseInt(new URLSearchParams(window.location.search).get("page") ?? "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [mrrVerified, setMrrVerified] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("mrr") === "1";
  });

  // Sync filter state → URL (replaceState so it doesn't pollute history)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    // Include lang in URL for all non-English selections so links are shareable
    if (language && language !== "english") params.set("lang", language);
    if (price !== "all") params.set("price", price);
    if (category) params.set("category", category);
    if (mrrVerified) params.set("mrr", "1");
    if (sort !== "trustSkore") params.set("sort", sort);
    if (direction !== "desc") params.set("dir", direction);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const newUrl = qs ? `/?${qs}` : "/";
    if (window.location.search !== (qs ? `?${qs}` : "")) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [debounced, language, price, category, mrrVerified, sort, direction, page]);

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
      category,
      mrrVerified: mrrVerified || undefined,
      sort,
      direction,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debounced, language, price, category, mrrVerified, sort, direction, page],
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
    setLanguage("english"); // always reset to english, not undefined
    setPrice("all");
    setCategory(undefined);
    setMrrVerified(false);
    setSort("trustSkore");
    setDirection("desc");
    setPage(1);
    navigate("/");
  };

  const hasActiveFilters = Boolean(debounced || language || price !== "all" || category || mrrVerified);

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
  const categories = filters?.categories ?? [];

  // Format stat numbers: exact number with locale formatting (e.g. 22,502)
  // Use fixed 'en-US' locale to prevent SSR/client hydration mismatch
  const fmtK = (n: number) => n.toLocaleString("en-US");

  return (
    <SiteLayout>
      {/* Live activity toast — bottom-left, only when data is loaded */}
      {data && data.items.length > 0 && (
        <LiveActivityToast communities={data.items.map(c => ({ slug: c.slug, displayName: c.displayName, logoUrl: c.logoUrl }))} />
      )}
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
          category={category}
          sort={sort}
          direction={direction}
          languages={languages}
          categories={categories}
          stats={stats}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          total={data?.total}
          fmtK={fmtK}
          mrrVerified={mrrVerified}
          onPrice={v => setFilter(() => setPrice(v))}
          onLanguage={v => setFilter(() => setLanguage(v))}
          onCategory={v => setFilter(() => setCategory(v))}
          onMrrVerified={v => setFilter(() => setMrrVerified(v))}
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
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-border bg-card px-4 text-sm font-medium disabled:opacity-40 transition-colors hover:border-foreground active:scale-[0.97]">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="px-2 text-sm text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-border bg-card px-4 text-sm font-medium disabled:opacity-40 transition-colors hover:border-foreground active:scale-[0.97]">
              Next <ChevronRight className="h-4 w-4" />
            </button>
            {/* Go-to-page input */}
            <form
              className="flex items-center gap-1.5"
              onSubmit={e => {
                e.preventDefault();
                const val = parseInt((e.currentTarget.elements.namedItem("gotopage") as HTMLInputElement).value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setPage(val);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  (e.currentTarget.elements.namedItem("gotopage") as HTMLInputElement).value = "";
                }
              }}>
              <label htmlFor="gotopage" className="text-xs text-muted-foreground whitespace-nowrap">Go to</label>
              <input
                id="gotopage"
                name="gotopage"
                type="number"
                min={1}
                max={totalPages}
                placeholder={String(page)}
                className="h-10 w-16 rounded-[4px] border border-border bg-card px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </form>
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
