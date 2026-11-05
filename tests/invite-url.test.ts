import { describe, expect, it } from "vitest";
import { buildInviteUrl, DEFAULT_APP_ORIGIN } from "../shared/invite.js";

describe("buildInviteUrl", () => {
  it("points at the app origin, never the Worker host", () => {
    const url = buildInviteUrl("https://ourcalendar-1ze.pages.dev", "tok123");
    expect(url).toBe("https://ourcalendar-1ze.pages.dev/invite/tok123");
    expect(url).not.toContain("workers.dev");
  });

  it("trims trailing slashes from the origin", () => {
    expect(buildInviteUrl("https://example.pages.dev///", "t")).toBe("https://example.pages.dev/invite/t");
  });

  it("defaults to the production app origin", () => {
    expect(DEFAULT_APP_ORIGIN).toBe("https://ourcalendar-1ze.pages.dev");
  });
});
