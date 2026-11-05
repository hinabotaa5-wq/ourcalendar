import { describe, expect, it } from "vitest";
import { allKeys, fmt, langFromStorage, LOCALES, STRINGS, tr } from "../shared/i18n.js";
import { LANGS } from "../shared/types.js";

describe("locale dictionaries", () => {
  it("has identical key sets in all three languages", () => {
    const base = allKeys().sort();
    expect(base.length).toBeGreaterThan(30);
    for (const lang of LANGS) {
      expect(Object.keys(STRINGS[lang]).sort()).toEqual(base);
    }
  });

  it("week starts Monday for Polish, Sunday for English and Japanese", () => {
    expect(LOCALES.pl.weekStart).toBe(1);
    expect(LOCALES.en.weekStart).toBe(0);
    expect(LOCALES.ja.weekStart).toBe(0);
  });

  it("interpolates variables", () => {
    expect(tr("en", "weekOf", { date: "2026-11-09" })).toBe("Week of 2026-11-09");
    expect(tr("ja", "testSent", { sent: 1, targets: 2 })).toContain("1/2");
    expect(fmt("a{b}c")).toBe("a{b}c");
  });
});

describe("language preference storage", () => {
  const store = (v: string | null) => langFromStorage(() => v);
  it("restores saved languages and defaults to English", () => {
    expect(store("pl")).toBe("pl");
    expect(store("ja")).toBe("ja");
    expect(store(null)).toBe("en");
    expect(store("de")).toBe("en");
  });
});
