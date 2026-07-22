import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { WatchlistCommunity } from "@/lib/watchlist";

export default function WatchlistButton({
  community,
  compact = false,
}: {
  community: WatchlistCommunity;
  compact?: boolean;
}) {
  const watchlist = useWatchlist();
  const saved = watchlist.has(community.slug);
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={() => watchlist.toggle(community)}
      className={`inline-flex items-center justify-center gap-2 rounded-[4px] border transition-colors ${
        saved
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:bg-accent"
      } ${compact ? "h-9 w-9" : "h-11 px-4 text-sm font-semibold"}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${community.displayName} from watchlist` : `Save ${community.displayName} to watchlist`}
      title={saved ? "Remove from watchlist" : "Save to watchlist — no account needed"}>
      <Icon className="h-4 w-4" />
      {!compact && (saved ? "Saved" : "Watch")}
    </button>
  );
}
