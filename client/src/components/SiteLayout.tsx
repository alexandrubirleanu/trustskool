import { Menu, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

/**
 * Public site layout: top-nav with TrustSkool branding, search bar and
 * Methodology link, plus the compliance footer. Used by every public page.
 */

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-foreground text-background">
        <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="font-heading text-lg font-700 tracking-tight" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          TrustSkool
        </span>
      )}
    </span>
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
              href="/methodology"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
              Methodology
            </Link>
            <a
              href="/go/signup"
              className="inline-flex h-9 items-center rounded-[4px] border border-foreground bg-foreground px-4 text-sm font-medium text-background transition-transform active:scale-[0.97]">
              Start on Skool
            </a>
          </nav>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-border md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 pb-4 pt-3 md:hidden">
            <NavSearch onNavigate={() => setMobileOpen(false)} />
            <div className="mt-3 flex flex-col gap-1">
              <Link
                href="/methodology"
                className="rounded-[4px] px-2 py-2 text-sm font-medium hover:bg-accent">
                Methodology
              </Link>
              <a
                href="/go/signup"
                className="mt-1 inline-flex h-10 items-center justify-center rounded-[4px] bg-foreground px-4 text-sm font-medium text-background">
                Start on Skool
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
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                TrustSkool ranks Skool communities by real growth data, not paid reviews. Every
                TrustSkore is computed from publicly observable metrics on a fixed methodology.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
              <Link href="/" className="text-foreground/80 hover:text-foreground">
                Rankings
              </Link>
              <Link href="/methodology" className="text-foreground/80 hover:text-foreground">
                Methodology
              </Link>
              <a href="/llms.txt" className="text-foreground/80 hover:text-foreground">
                llms.txt
              </a>
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            <p>
              Affiliate disclosure: some links on this site are affiliate links. If you join a
              community or create a Skool account through them, TrustSkool may earn a commission at
              no extra cost to you. This never affects rankings, which are computed only from
              growth data.
            </p>
            <p className="mt-2">
              TrustSkool is an independent project and is not affiliated with, endorsed by, or
              sponsored by Skool.com. © {new Date().getFullYear()} TrustSkool.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
