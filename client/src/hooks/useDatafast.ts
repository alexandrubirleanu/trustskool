/**
 * useDatafast — thin wrapper around window.datafast for Datafa.st custom goal tracking.
 *
 * Usage:
 *   const { track } = useDatafast();
 *   track("skool_click", { slug: "income-junkie", price_type: "free", source: "header" });
 *
 * Rules (from Datafa.st docs):
 *   - goal_name: lowercase, numbers, underscores, hyphens, colons. Max 64 chars.
 *   - param keys: lowercase, numbers, underscores, hyphens. Max 64 chars.
 *   - param values: any string, max 255 chars. Max 10 params per event.
 */

type DatafastParams = Record<string, string>;

declare global {
  interface Window {
    datafast?: (goal: string, params?: DatafastParams) => void;
  }
}

export function useDatafast() {
  function track(goal: string, params?: DatafastParams) {
    try {
      window?.datafast?.(goal, params);
    } catch {
      // Never throw — analytics must never break the UI
    }
  }

  return { track };
}
