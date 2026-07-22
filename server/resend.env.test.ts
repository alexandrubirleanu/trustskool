import { describe, expect, it } from "vitest";

describe("Resend configuration", () => {
  it("validates configured values without requiring production secrets", () => {
    if (process.env.RESEND_API_KEY) {
      expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
    }
    if (process.env.NOTIFICATION_EMAIL) {
      expect(process.env.NOTIFICATION_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    }
  });

  it.skipIf(!process.env.RESEND_API_KEY)("authenticates against the Resend API", async () => {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    // 200 = valid key; 401 = invalid key
    expect(res.status, `Resend API returned ${res.status}`).toBe(200);
  });
});
