import type { DailyActivity } from "@/bindings";

/** Una celda del mapa. `null` en la rejilla significa relleno, no día vacío. */
export interface ActivityCell {
  day: string;
  dictations: number;
  failed: number;
  words: number;
  /** 0 = sin dictados; 1-4 escalan con las palabras del rango. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityTotals {
  dictations: number;
  failed: number;
  words: number;
  wordsAdded: number;
  /** Días con al menos un dictado con texto. Los de solo fallos no cuentan. */
  activeDays: number;
  bestDayWords: number;
}

/**
 * Las fechas se manejan como texto `YYYY-MM-DD` y se convierten a UTC solo para
 * contar días. Construirlas con `new Date("2026-07-31")` y leerlas en local
 * desplazaría un día en cualquier huso al oeste de Greenwich — y el día ya viene
 * congelado desde el backend.
 */
const toUtc = (day: string): Date => new Date(`${day}T00:00:00Z`);

const toDayString = (date: Date): string => date.toISOString().slice(0, 10);

/** 0 = lunes … 6 = domingo. */
const weekdayIndex = (date: Date): number => (date.getUTCDay() + 6) % 7;

const levelFor = (
  words: number,
  dictations: number,
  maxWords: number,
): ActivityCell["level"] => {
  if (dictations <= 0) return 0;
  if (maxWords <= 0) return 1;
  const share = words / maxWords;
  if (share > 0.75) return 4;
  if (share > 0.5) return 3;
  if (share > 0.25) return 2;
  return 1;
};

/**
 * Rejilla estilo calendario: una columna por semana (lunes arriba), con relleno
 * al principio y al final para que las semanas parciales sigan alineadas.
 */
export const buildActivityWeeks = (
  fromDay: string,
  toDay: string,
  days: DailyActivity[],
): (ActivityCell | null)[][] => {
  const byDay = new Map(days.map((entry) => [entry.day, entry]));
  const maxWords = days.reduce(
    (max, entry) => (entry.dictations > 0 ? Math.max(max, entry.words) : max),
    0,
  );

  const start = toUtc(fromDay);
  const end = toUtc(toDay);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const weeks: (ActivityCell | null)[][] = [];
  let column: (ActivityCell | null)[] = Array(weekdayIndex(start)).fill(null);

  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const key = toDayString(cursor);
    const entry = byDay.get(key);
    column.push({
      day: key,
      dictations: entry?.dictations ?? 0,
      failed: entry?.failed ?? 0,
      words: entry?.words ?? 0,
      level: levelFor(entry?.words ?? 0, entry?.dictations ?? 0, maxWords),
    });

    if (column.length === 7) {
      weeks.push(column);
      column = [];
    }
  }

  if (column.length > 0) {
    weeks.push([...column, ...Array(7 - column.length).fill(null)]);
  }

  return weeks;
};

export const summarize = (days: DailyActivity[]): ActivityTotals =>
  days.reduce<ActivityTotals>(
    (totals, entry) => ({
      dictations: totals.dictations + entry.dictations,
      failed: totals.failed + entry.failed,
      words: totals.words + entry.words,
      wordsAdded: totals.wordsAdded + entry.words_added,
      activeDays: totals.activeDays + (entry.dictations > 0 ? 1 : 0),
      bestDayWords: Math.max(totals.bestDayWords, entry.words),
    }),
    {
      dictations: 0,
      failed: 0,
      words: 0,
      wordsAdded: 0,
      activeDays: 0,
      bestDayWords: 0,
    },
  );
