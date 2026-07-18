import { describe, expect, it } from "vitest";

describe("Resend configuration", () => {
  it("has RESEND_API_KEY and NOTIFICATION_EMAIL set", () => {
    expect(process.env.RESEND_API_KEY, "RESEND_API_KEY missing").toBeTruthy();
    expect(process.env.NOTIFICATION_EMAIL, "NOTIFICATION_EMAIL missing").toBeTruthy();
    expect(process.env.NOTIFICATION_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it("authenticates against the Resend API", async () => {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    // 200 = valid key; 401 = invalid key
    expect(res.status, `Resend API returned ${res.status}`).toBe(200);
  });
});
