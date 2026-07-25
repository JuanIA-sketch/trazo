export interface ReplacementRule {
  from: string;
  to: string;
}

export interface ParsedReplacementCsv {
  rules: ReplacementRule[];
  /** Rows that looked like data but were unusable (missing a column or side). */
  skipped: number;
}

const HEADER_WORDS = new Set([
  "from",
  "to",
  "abreviatura",
  "abreviacion",
  "abreviación",
  "texto",
  "reemplazo",
  "expansion",
  "expansión",
  "replacement",
  "shortcut",
]);

/** Strips one layer of surrounding quotes and unescapes doubled quotes. */
function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').trim();
  }
  return trimmed;
}

/**
 * Splits a CSV line into exactly two fields, honouring quoted values so a
 * replacement containing the delimiter survives. Returns null when the line
 * has no delimiter outside quotes.
 */
function splitRow(line: string, delimiter: string): [string, string] | null {
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // A doubled quote is an escaped quote, not a state change.
      if (inQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      return [line.slice(0, i), line.slice(i + 1)];
    }
  }
  return null;
}

/**
 * Parses a two-column CSV of dictionary rules (`abbreviation,expansion`).
 *
 * Tolerates what spreadsheets actually produce: a header row, blank lines,
 * quoted values containing the delimiter, and the semicolon delimiter Excel
 * writes in Spanish locales. Unusable rows are counted rather than silently
 * dropped, so the UI can tell the user how many were ignored.
 */
export function parseReplacementCsv(text: string): ParsedReplacementCsv {
  const lines = text.split(/\r?\n/);
  // Pick the delimiter from the first non-empty line: semicolon only wins when
  // there is no comma outside quotes.
  const sample = lines.find((l) => l.trim().length > 0) ?? "";
  const delimiter =
    splitRow(sample, ",") === null && splitRow(sample, ";") !== null
      ? ";"
      : ",";

  const rules: ReplacementRule[] = [];
  let skipped = 0;

  for (const [index, line] of lines.entries()) {
    if (line.trim().length === 0) continue;

    const parts = splitRow(line, delimiter);
    if (!parts) {
      skipped++;
      continue;
    }

    const from = unquote(parts[0]);
    const to = unquote(parts[1]);

    // A header only counts as such on the first data row, so a legitimate
    // rule that happens to expand the word "to" later on is not dropped.
    const isFirstRow = lines
      .slice(0, index)
      .every((l) => l.trim().length === 0);
    if (
      isFirstRow &&
      HEADER_WORDS.has(from.toLowerCase()) &&
      HEADER_WORDS.has(to.toLowerCase())
    ) {
      continue;
    }

    if (!from || !to) {
      skipped++;
      continue;
    }

    rules.push({ from, to });
  }

  return { rules, skipped };
}
