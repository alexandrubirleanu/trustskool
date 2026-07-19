import { Menu, Search, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
/**
 * Public site layout: top-nav with TrustSkool branding, search bar and
 * Methodology link, plus the compliance footer. Used by every public page.
 */

function BrandMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <img
          src="/manus-storage/trustskool-icon-only_a356506a.png"
          alt="TrustSkool"
          width="36"
          height="36"
          className="h-9 w-auto object-contain"
        />
        <span className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>TrustSkool</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/manus-storage/trustskool-icon-only_a356506a.png"
        alt="TrustSkool"
        width="40"
        height="40"
        className="h-10 w-auto object-contain"
      />
      <span className="text-[22px] font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>TrustSkool</span>
    </div>
  );
}

function NavSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
    onNavigate?.();
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search communities…"
        aria-label="Search communities"
        className="h-9 w-full rounded-[4px] border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-foreground"
      />
    </form>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    // Scroll to top on every route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="TrustSkool home" className="shrink-0">
            <BrandMark />
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <NavSearch />
          </div>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            <Link
              href="/resources"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              Resources
            </Link>
            <Link
              href="/news"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              News
            </Link>
            <Link
              href="/rankings"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              Rankings
            </Link>
            <Link
              href="/methodology"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              Methodology
            </Link>
            <a
              href="/go/signup"
              target="_blank" rel="sponsored noopener noreferrer"
              data-fast-goal="skool_click"
              data-fast-goal-source="nav_desktop"
              className="inline-flex h-9 items-center rounded-[4px] bg-[#F8D481] px-4 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
              Start on Skool for $9
            </a>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-border"
              aria-label="Search communities"
              onClick={() => setMobileOpen(true)}>
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-border"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 pb-4 pt-3 md:hidden">
            <NavSearch onNavigate={() => setMobileOpen(false)} />
            <div className="mt-3 flex flex-col gap-1">
              <Link
                href="/resources"
                className="rounded-[4px] px-2 py-2 text-sm font-medium hover:bg-accent">
                Resources
              </Link>
              <Link
                href="/news"
                className="rounded-[4px] px-2 py-2 text-sm font-medium hover:bg-accent">
                News
              </Link>
              <Link
                href="/rankings"
                className="rounded-[4px] px-2 py-2 text-sm font-medium hover:bg-accent">
                Rankings
              </Link>
              <Link
                href="/methodology"
                className="rounded-[4px] px-2 py-2 text-sm font-medium hover:bg-accent">
                Methodology
              </Link>
              <a
                href="/go/signup"
                target="_blank" rel="sponsored noopener noreferrer"
                data-fast-goal="skool_click"
                data-fast-goal-source="nav_mobile"
                className="mt-1 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#F8D481] px-4 text-sm font-bold text-[#202124]">
                Start on Skool for $9
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="container py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <BrandMark />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-balance">
                TrustSkool ranks Skool communities by real growth data. No paid reviews. Every TrustSkore uses publicly observable metrics on a fixed methodology.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
              <Link href="/rankings" className="text-foreground/80 hover:text-foreground">
                Rankings
              </Link>
              <Link href="/resources" className="text-foreground/80 hover:text-foreground">
                Resources
              </Link>
              <Link href="/news" className="text-foreground/80 hover:text-foreground">
                News
              </Link>
              <Link href="/methodology" className="text-foreground/80 hover:text-foreground">
                Methodology
              </Link>
              <Link href="/policy/fraud-response" className="text-foreground/80 hover:text-foreground">
                Fraud Policy
              </Link>
              <a href="/llms.txt" className="text-foreground/80 hover:text-foreground">
                llms.txt
              </a>
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            <p>
              Affiliate disclosure: some links on this site are affiliate links. If you join a community or create a Skool account through them, TrustSkool may earn a commission at no extra cost to you. This never affects rankings, which are computed only from growth data.
            </p>
            <p className="mt-2">
              TrustSkool is an independent project and is not affiliated with, endorsed by, or sponsored by Skool.com. © {new Date().getFullYear()} TrustSkool.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
