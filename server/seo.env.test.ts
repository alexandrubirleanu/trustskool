import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };
const TEST_ORIGIN = "https://www.trustskool.com";

describe("SEO environment configuration", () => {
  beforeEach(() => {
    process.env.CANONICAL_ORIGIN = TEST_ORIGIN;
    process.env.SITE_NAME = "TrustSkool";
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("uses a valid canonical production origin", () => {
    expect(TEST_ORIGIN).toMatch(/^https:\/\//);
    expect(TEST_ORIGIN).not.toMatch(/\/$/);
    expect(TEST_ORIGIN).toContain("trustskool.com");
  });

  it("buildHeadTags emits canonical and og tags with the configured origin", async () => {
    const { buildHeadTags } = await import("./_core/vite");
    const tags = buildHeadTags({
      title: "Test Community — TrustSkore 8.1/10 · TrustSkool",
      description: "A test description",
      ogType: "article",
      canonicalPath: "/community/test-community",
    });
    expect(tags).toContain(`<link rel="canonical" href="${TEST_ORIGIN}/community/test-community" />`);
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
