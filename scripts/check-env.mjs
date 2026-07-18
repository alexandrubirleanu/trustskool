import "dotenv/config";
console.log("NOTIFICATION_EMAIL:", process.env.NOTIFICATION_EMAIL);
console.log("EMAIL_FROM_FALLBACK:", process.env.EMAIL_FROM_FALLBACK);
console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
