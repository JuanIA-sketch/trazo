import { describe, expect, test } from "bun:test";
import { parseReplacementCsv } from "./replacementCsv";

/**
 * CSV import for dictionary rules. Users bring these from a spreadsheet, so
 * the parser has to survive the usual mess: headers, blank lines, quoted
 * values, and the semicolon delimiter Excel writes in Spanish locales.
 */
describe("parseReplacementCsv", () => {
  test("parses abbreviation,expansion rows", () => {
    const { rules } = parseReplacementCsv("pq,porque\ntb,también");
    expect(rules).toEqual([
      { from: "pq", to: "porque" },
      { from: "tb", to: "también" },
    ]);
  });

  test("trims surrounding whitespace", () => {
    const { rules } = parseReplacementCsv("  pq ,  porque  ");
    expect(rules).toEqual([{ from: "pq", to: "porque" }]);
  });

  test("skips blank lines without counting them as errors", () => {
    const { rules, skipped } = parseReplacementCsv(
      "pq,porque\n\n\ntb,también\n",
    );
    expect(rules).toHaveLength(2);
    expect(skipped).toBe(0);
  });

  test("drops a header row", () => {
    const { rules, skipped } = parseReplacementCsv("from,to\npq,porque");
    expect(rules).toEqual([{ from: "pq", to: "porque" }]);
    expect(skipped).toBe(0);
  });

  test("keeps commas inside quoted values", () => {
    const { rules } = parseReplacementCsv('tks,"Thanks, Charly"');
    expect(rules).toEqual([{ from: "tks", to: "Thanks, Charly" }]);
  });

  test("accepts the semicolon delimiter Spanish Excel writes", () => {
    const { rules } = parseReplacementCsv("pq;porque");
    expect(rules).toEqual([{ from: "pq", to: "porque" }]);
  });

  test("counts malformed rows instead of importing them", () => {
    const { rules, skipped } = parseReplacementCsv(
      "pq,porque\nsolo-una-columna\n,vacio\nvacio,",
    );
    expect(rules).toEqual([{ from: "pq", to: "porque" }]);
    expect(skipped).toBe(3);
  });

  test("an empty file imports nothing", () => {
    expect(parseReplacementCsv("")).toEqual({ rules: [], skipped: 0 });
  });
});
