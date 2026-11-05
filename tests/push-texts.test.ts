import { describe, expect, it } from "vitest";
import { pushText } from "../shared/push-texts.js";

describe("pushText language selection", () => {
  it("picks the recipient language for each kind", () => {
    expect(pushText("pl", "workout", "Bieganie").title).toContain("trening");
    expect(pushText("pl", "workout", "Bieganie").body).toBe("Bieganie");
    expect(pushText("ja", "weight").title).toBe("体重記録");
    expect(pushText("en", "test").body).toContain("Push works");
    expect(pushText("pl", "test").body).toContain("działają");
  });
});
