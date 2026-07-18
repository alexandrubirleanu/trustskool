import { DEFAULT_DATASET_URL } from "../shared/appConfig";

/**
 * Server-side configuration, read from env in ONE place.
 * Never expose these values client-side.
 */
export const serverConfig = {
  get resendApiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  get notificationEmail(): string | undefined {
    return process.env.NOTIFICATION_EMAIL;
  },
  get datasetUrl(): string {
    return process.env.DATASET_URL || DEFAULT_DATASET_URL;
  },
  get emailFrom(): string {
    // Primary: noreply@trustskool.com (DNS records added; pending Resend verification).
    // Fallback: EMAIL_FROM_FALLBACK env var (set to a verified domain address) used
    // automatically while trustskool.com verification is still propagating.
    return process.env.EMAIL_FROM
      || process.env.EMAIL_FROM_FALLBACK
      || "TrustSkool <noreply@trustskool.com>";
  },
};
