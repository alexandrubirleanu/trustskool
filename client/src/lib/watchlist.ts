export const WATCHLIST_STORAGE_KEY = "trustskool.watchlist.v1";
export const WATCHLIST_CHANGED_EVENT = "trustskool:watchlist-changed";

export type WatchlistSnapshot = {
  totalMembers: number;
  priceAmountCents: number | null;
  trustSkore: number;
  growthRateBp: number;
};

export type WatchlistEntry = {
  slug: string;
  displayName: string;
  savedAt: string;
  snapshot: WatchlistSnapshot;
};

export type WatchlistCommunity = WatchlistSnapshot & {
  slug: string;
  displayName: string;
};

function isEntry(value: unknown): value is WatchlistEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WatchlistEntry>;
  return Boolean(
    item.slug &&
      item.displayName &&
      item.savedAt &&
      item.snapshot &&
      typeof item.snapshot.totalMembers === "number" &&
      typeof item.snapshot.trustSkore === "number" &&
      typeof item.snapshot.growthRateBp === "number",
  );
}

export function readWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function writeWatchlist(entries: WatchlistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
  window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT));
}

export function createWatchlistEntry(community: WatchlistCommunity): WatchlistEntry {
  return {
    slug: community.slug,
    displayName: community.displayName,
    savedAt: new Date().toISOString(),
    snapshot: {
      totalMembers: community.totalMembers,
      priceAmountCents: community.priceAmountCents,
      trustSkore: community.trustSkore,
      growthRateBp: community.growthRateBp,
    },
  };
}

export function toggleWatchlistEntry(community: WatchlistCommunity): WatchlistEntry[] {
  const entries = readWatchlist();
  const exists = entries.some(entry => entry.slug === community.slug);
  const next = exists
    ? entries.filter(entry => entry.slug !== community.slug)
    : [createWatchlistEntry(community), ...entries];
  writeWatchlist(next);
  return next;
}

export function refreshWatchlistEntry(community: WatchlistCommunity): WatchlistEntry[] {
  const entries = readWatchlist();
  const next = entries.map(entry =>
    entry.slug === community.slug ? createWatchlistEntry(community) : entry,
  );
  writeWatchlist(next);
  return next;
}
