import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import CommunityCard from "@/components/CommunityCard";
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatCategory } from "@/lib/format";
import { trpc } from "@/lib/trpc";

type SortKey = "trustSkore" | "totalMembers" | "growthRateBp" | "category";
type PriceKey = "all" | "free" | "paid";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "trustSkore", label: "TrustSkore" },
  { key: "totalMembers", label: "Members" },
  { key: "growthRateBp", label: "Growth" },
  { key: "category", label: "Category" },
];

const PAGE_SIZE = 24;

export default function Home() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const urlQuery = useMemo(() => new URLSearchParams(searchString).get("q") ?? "", [searchString]);

  const [search, setSearch] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  const [language, setLanguage] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [price, setPrice] = useState<PriceKey>("all");
  const [sort, setSort] = useState<SortKey>("trustSkore");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // keep local search in sync when the top-nav search navigates to /?q=
  useEffect(() => {
    setSearch(urlQuery);
    setDebounced(urlQuery);
    setPage(1);
  }, [urlQuery]);

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
      category,
      price,
      sort,
      direction,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debounced, language, category, price, sort, direction, page],
  );

  const { data, isLoading } = trpc.communities.list.useQuery(listInput, {
    placeholderData: prev => prev,
  });
  const { data: filters } = trpc.communities.filters.useQuery();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDirection(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setDirection(key === "category" ? "asc" : "desc");
    }
    setPage(1);
  };

  const setFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const languages = filters?.languages ?? [];
  const categories = filters?.categories ?? [];

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="container py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 className="text-[32px] font-bold leading-tight tracking-tight md:text-[45px]">
              Skool community rankings built on real growth data.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Every community gets a <strong className="font-semibold text-foreground">TrustSkore</strong> computed
              from member growth, discovery-ranking momentum and price stability — never from paid
              reviews or sponsorships.
            </p>
          </div>

          {/* In-page search */}
          <div className="relative mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or topic…"
              aria-label="Search communities"
              className="h-12 w-full rounded-[4px] border border-input bg-background pl-11 pr-4 text-[15px] outline-none transition-colors focus:border-foreground"
            />
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Price filter">
            {(["all", "free", "paid"] as PriceKey[]).map(key => (
              <button
                key={key}
                type="button"
                className="chip"
                data-active={price === key}
                onClick={() => setFilter(() => setPrice(key))}>
                {key === "all" ? "All prices" : capitalize(key)}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
            {languages.slice(0, 6).map(lang => (
              <button
                key={lang.value}
                type="button"
                className="chip"
                data-active={language === lang.value}
                onClick={() =>
                  setFilter(() => setLanguage(l => (l === lang.value ? undefined : lang.value)))
                }>
                {capitalize(lang.value)}
              </button>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category filter">
              {categories.slice(0, 10).map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className="chip"
                  data-active={category === cat.value}
                  onClick={() =>
                    setFilter(() => setCategory(c => (c === cat.value ? undefined : cat.value)))
                  }>
                  {formatCategory(cat.value)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort header */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {data ? `${data.total} communities` : "Loading…"}
          </p>
          <div className="flex items-center gap-1" role="group" aria-label="Sort by">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sort
            </span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleSort(opt.key)}
                aria-pressed={sort === opt.key}
                className={`inline-flex h-8 items-center gap-1 rounded-[4px] border px-2.5 text-xs font-medium transition-colors ${
                  sort === opt.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground"
                }`}>
                {opt.label}
                {sort === opt.key &&
                  (direction === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mt-4 rounded-[4px] border border-border">
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
                Try clearing the search or picking a different category.
              </p>
              <button
                type="button"
                className="chip mt-4"
                onClick={() => {
                  setSearch("");
                  setLanguage(undefined);
                  setCategory(undefined);
                  setPrice("all");
                  navigate("/");
                }}>
                Reset filters
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
              className="inline-flex h-9 items-center gap-1 rounded-[4px] border border-border bg-card px-3 text-sm font-medium disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="px-2 text-sm text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-[4px] border border-border bg-card px-3 text-sm font-medium disabled:opacity-40">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}

        {/* Secondary CTA banner */}
        <aside className="mt-12 rounded-[4px] border border-foreground bg-foreground px-6 py-10 text-background md:px-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-background md:text-2xl">
                Thinking of starting your own community?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-background/70 md:text-base">
                Skool gives you a community, courses and events under one roof. Launch yours and
                start building the growth record that earns a TrustSkore.
              </p>
            </div>
            <a
              href="/go/signup"
              className="inline-flex h-11 shrink-0 items-center rounded-[4px] border border-background bg-background px-6 text-sm font-semibold text-foreground transition-transform active:scale-[0.97]">
              Create your Skool community
            </a>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
