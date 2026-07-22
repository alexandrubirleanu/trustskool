import { useCallback, useEffect, useState } from "react";
import {
  readWatchlist,
  refreshWatchlistEntry,
  toggleWatchlistEntry,
  WATCHLIST_CHANGED_EVENT,
  type WatchlistCommunity,
} from "@/lib/watchlist";

export function useWatchlist() {
  const [entries, setEntries] = useState(() => readWatchlist());

  useEffect(() => {
    const sync = () => setEntries(readWatchlist());
    window.addEventListener("storage", sync);
    window.addEventListener(WATCHLIST_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, sync);
    };
  }, []);

  const toggle = useCallback((community: WatchlistCommunity) => {
    setEntries(toggleWatchlistEntry(community));
  }, []);

  const refresh = useCallback((community: WatchlistCommunity) => {
    setEntries(refreshWatchlistEntry(community));
  }, []);

  return {
    entries,
    slugs: entries.map(entry => entry.slug),
    count: entries.length,
    has: (slug: string) => entries.some(entry => entry.slug === slug),
    toggle,
    refresh,
  };
}
