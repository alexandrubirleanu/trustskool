import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Users, ExternalLink } from "lucide-react";

export interface LiveActivityItem {
  slug: string;
  displayName: string;
  logoUrl: string | null;
}

type EventType = "view" | "join";

interface ActivityEvent {
  id: number;
  type: EventType;
  community: LiveActivityItem;
}

/**
 * Live activity toast — bottom-left corner.
 * Shows "Someone is viewing [community]" and "Someone just joined [community]"
 * using real community names from the leaderboard, with plausible timing.
 *
 * Design rules:
 * - Only one toast visible at a time
 * - Auto-dismiss after 4s
 * - Slide in from left, fade out
 * - ~70% "view" events, ~30% "join" events (mirrors realistic funnel)
 * - First event fires after 6-12s (don't interrupt initial page load)
 * - Subsequent events every 12-25s (not spammy)
 * - Picks from top-50 communities weighted by position (top ones appear more)
 */
export default function LiveActivityToast({ communities }: { communities: LiveActivityItem[] }) {
  const [current, setCurrent] = useState<ActivityEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const counterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!communities.length) return;

    // Pick a community weighted toward the top of the list
    function pickCommunity(): LiveActivityItem {
      // Weight: position 0 has weight 50, position 49 has weight 1; linear decay
      const pool = communities.slice(0, 50);
      const weights = pool.map((_, i) => Math.max(1, 50 - i));
      const total = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) return pool[i];
      }
      return pool[0];
    }

    function showNext() {
      const type: EventType = Math.random() < 0.7 ? "view" : "join";
      const community = pickCommunity();
      const id = ++counterRef.current;
      setCurrent({ id, type, community });
      setVisible(true);

      // Auto-dismiss after 4s
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // Schedule next event after dismiss + gap
        const gap = 12_000 + Math.random() * 13_000; // 12-25s
        timerRef.current = setTimeout(showNext, gap);
      }, 4_000);
    }

    // First event after 6-12s
    const initial = 6_000 + Math.random() * 6_000;
    timerRef.current = setTimeout(showNext, initial);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communities.length]);

  if (!current) return null;

  const label =
    current.type === "join"
      ? "Someone just joined"
      : "Someone is viewing";

  const icon =
    current.type === "join" ? (
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[oklch(0.5_0.12_155)]" />
    ) : (
      <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    );

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={[
        "fixed bottom-6 left-4 z-50 max-w-[260px] sm:max-w-[300px]",
        "rounded-[6px] border border-border bg-card shadow-lg",
        "flex items-center gap-2.5 px-3 py-2.5",
        "transition-all duration-300",
        visible
          ? "translate-x-0 opacity-100"
          : "-translate-x-4 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Avatar */}
      {current.community.logoUrl ? (
        <img
          src={current.community.logoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-semibold text-foreground">
          {current.community.displayName.slice(0, 2).toUpperCase()}
        </span>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {icon}
          <span>{label}</span>
        </p>
        <Link
          href={`/community/${current.community.slug}`}
          className="block truncate text-[12px] font-semibold leading-snug text-foreground hover:underline"
        >
          {current.community.displayName}
        </Link>
      </div>
    </div>
  );
}
