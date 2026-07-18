import { describe, expect, it } from "vitest";

describe("SEO environment configuration", () => {
  it("CANONICAL_ORIGIN is set to the production domain", () => {
    const origin = process.env.CANONICAL_ORIGIN;
    expect(origin).toBeTruthy();
    expect(origin).toMatch(/^https:\/\//);
    expect(origin).not.toMatch(/\/$/); // no trailing slash
    expect(origin).toContain("trustskool.com");
  });

  it("SITE_NAME is set", () => {
    expect(process.env.SITE_NAME).toBe("TrustSkool");
  });

  it("buildHeadTags emits canonical and og tags with the configured origin", async () => {
    const { buildHeadTags } = await import("./_core/vite");
    const tags = buildHeadTags({
      title: "Test Community — TrustSkore 8.1/10 · TrustSkool",
      description: "A test description",
      ogType: "article",
      canonicalPath: "/community/test-community",
    });
    expect(tags).toContain(`<link rel="canonical" href="${process.env.CANONICAL_ORIGIN}/community/test-community" />`);
    expect(tags).toContain(`og:url`);
    expect(tags).toContain(`og:site_name" content="TrustSkool"`);
    expect(tags).not.toContain("noindex");
  });

  it("buildHeadTags escapes HTML in dynamic values", async () => {
    const { buildHeadTags } = await import("./_core/vite");
    const tags = buildHeadTags({
      title: `</title><script>alert(1)</script>`,
      description: `"quotes" & <angle>`,
    });
    expect(tags).not.toContain("<script>alert");
    expect(tags).toContain("&lt;script&gt;");
  });
});
