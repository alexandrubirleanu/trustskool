import { useEffect } from "react";
import { useLocation } from "wouter";
import { BRAND_NAME } from "@shared/appConfig";

const SITE = BRAND_NAME;

// Static public routes only; dynamic detail pages use useDocumentTitle.
const ROUTE_TITLES: Record<string, string> = {
  "/": `${SITE}: Skool community leaderboard, ranked by TrustSkore`,
  "/methodology": `How the TrustSkore is calculated · ${SITE}`,
  "/admin/clicks": `Click tracking · ${SITE}`,
};

/**
 * Syncs document.title on client-side navigation (SSR bakes the title into
 * the initial HTML only). Mounted once in App.
 */
export function Head() {
  const [location] = useLocation();
  useEffect(() => {
    const t = ROUTE_TITLES[location.replace(/\/+$/, "") || "/"];
    if (t) document.title = t;
  }, [location]);
  return null;
}

/** For detail pages: call with the fetched record's title once data arrives. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title?.trim()) document.title = title;
  }, [title]);
}
