import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export type DisclaimerRiskLevel = "info" | "caution" | "warning";

interface DisclaimerBannerProps {
  /** Risk level controls the visual style and default icon. */
  level: DisclaimerRiskLevel;
  /** Main message text. */
  message: string;
  /** Optional call-to-action link label + href. */
  cta?: { label: string; href: string; external?: boolean };
  className?: string;
}

const CONFIG: Record<
  DisclaimerRiskLevel,
  { icon: React.ElementType; containerClass: string; iconClass: string; textClass: string }
> = {
  info: {
    icon: Info,
    containerClass: "border-border bg-secondary/60",
    iconClass: "text-muted-foreground",
    textClass: "text-muted-foreground",
  },
  caution: {
    icon: AlertTriangle,
    containerClass: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    iconClass: "text-amber-600 dark:text-amber-400",
    textClass: "text-amber-900 dark:text-amber-200",
  },
  warning: {
    icon: ShieldAlert,
    containerClass: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40",
    iconClass: "text-red-600 dark:text-red-400",
    textClass: "text-red-900 dark:text-red-200",
  },
};

/**
 * DisclaimerBanner — reusable parameterized disclaimer component.
 *
 * Usage:
 *   <DisclaimerBanner level="info" message="TrustSkool is not affiliated with Skool.com." />
 *   <DisclaimerBanner level="caution" message="This community is under review." cta={{ label: "Learn more", href: "/policy/fraud-response" }} />
 *   <DisclaimerBanner level="warning" message="This community has been flagged for credible fraud reports." cta={{ label: "Fraud policy", href: "/policy/fraud-response" }} />
 */
export default function DisclaimerBanner({ level, message, cta, className = "" }: DisclaimerBannerProps) {
  const { icon: Icon, containerClass, iconClass, textClass } = CONFIG[level];

  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-[4px] border px-4 py-3 text-sm ${containerClass} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
      <div className={`flex-1 leading-relaxed ${textClass}`}>
        <span>{message}</span>
        {cta && (
          <>
            {" "}
            {cta.external ? (
              <a
                href={cta.href}
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:opacity-80">
                {cta.label}
              </a>
            ) : (
              <Link href={cta.href} className="font-medium underline underline-offset-2 hover:opacity-80">
                {cta.label}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
