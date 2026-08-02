import { describe, expect, it } from "bun:test";
import type { DailyActivity } from "@/bindings";
import { buildActivityWeeks, summarize } from "./activityGrid";

const day = (
  day: string,
  overrides: Partial<DailyActivity> = {},
): DailyActivity => ({
  day,
  dictations: 1,
  failed: 0,
  words: 10,
  words_added: 0,
  post_processed: 0,
  max_words: 10,
  profile_hist: {},
  ...overrides,
});

describe("buildActivityWeeks", () => {
  // 2026-07-27 es lunes y 2026-08-02 domingo: una semana exacta.
  it("coloca una semana completa en una sola columna", () => {
    const weeks = buildActivityWeeks("2026-07-27", "2026-08-02", []);

    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[0].map((cell) => cell?.day)).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  // El hueco de la primera columna es padding, no un día sin actividad: si se
  // pintara como celda vacía el usuario leería días que no pidió.
  it("rellena con huecos hasta el día de la semana del primer día", () => {
    // 2026-07-29 es miércoles → dos huecos (lunes y martes).
    const weeks = buildActivityWeeks("2026-07-29", "2026-07-31", []);

    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]).toBeNull();
    expect(weeks[0][2]?.day).toBe("2026-07-29");
    expect(weeks[0][5]).toBeNull();
  });

  it("cubre cada día del rango exactamente una vez", () => {
    const weeks = buildActivityWeeks("2026-06-01", "2026-07-31", []);

    const days = weeks
      .flat()
      .filter((cell) => cell !== null)
      .map((cell) => cell!.day);
    expect(days).toHaveLength(61);
    expect(new Set(days).size).toBe(61);
    expect(days[0]).toBe("2026-06-01");
    expect(days[60]).toBe("2026-07-31");
  });

  it("un día sin fila es una celda a cero, no un hueco", () => {
    const weeks = buildActivityWeeks("2026-07-27", "2026-08-02", [
      day("2026-07-29"),
    ]);

    const cell = weeks[0][0];
    expect(cell).not.toBeNull();
    expect(cell?.dictations).toBe(0);
    expect(cell?.level).toBe(0);
  });

  it("escala el nivel con las palabras del día", () => {
    const weeks = buildActivityWeeks("2026-07-27", "2026-08-02", [
      day("2026-07-27", { words: 100 }),
      day("2026-07-28", { words: 10 }),
      day("2026-07-29", { words: 60 }),
    ]);

    const byDay = new Map(
      weeks
        .flat()
        .filter((cell) => cell !== null)
        .map((cell) => [cell!.day, cell!]),
    );
    expect(byDay.get("2026-07-27")!.level).toBe(4);
    expect(byDay.get("2026-07-29")!.level).toBe(3);
    expect(byDay.get("2026-07-28")!.level).toBe(1);
    expect(byDay.get("2026-07-30")!.level).toBe(0);
  });

  // Misma regla que en el backend: un día de puros fallos no es un día activo.
  // La celda se marca aparte para poder pintarla distinta de un día en blanco.
  it("un día de solo fallos queda en nivel cero pero marcado", () => {
    const weeks = buildActivityWeeks("2026-07-27", "2026-08-02", [
      day("2026-07-27", { dictations: 0, failed: 3, words: 0 }),
    ]);

    const cell = weeks[0][0]!;
    expect(cell.level).toBe(0);
    expect(cell.failed).toBe(3);
  });
});

describe("summarize", () => {
  it("suma los totales del rango", () => {
    const totals = summarize([
      day("2026-07-29", {
        dictations: 2,
        words: 30,
        words_added: 4,
        failed: 1,
      }),
      day("2026-07-31", { dictations: 3, words: 70, words_added: -2 }),
    ]);

    expect(totals.dictations).toBe(5);
    expect(totals.words).toBe(100);
    expect(totals.wordsAdded).toBe(2);
    expect(totals.failed).toBe(1);
    expect(totals.activeDays).toBe(2);
  });

  // Un día que solo acumuló fallos no cuenta como día activo.
  it("no cuenta como día activo uno de solo fallos", () => {
    const totals = summarize([
      day("2026-07-30", { dictations: 0, failed: 2, words: 0 }),
    ]);

    expect(totals.activeDays).toBe(0);
    expect(totals.failed).toBe(2);
  });

  it("un rango vacío suma cero", () => {
    expect(summarize([])).toEqual({
      dictations: 0,
      failed: 0,
      words: 0,
      wordsAdded: 0,
      activeDays: 0,
      bestDayWords: 0,
    });
  });

  it("se queda con el día más largo del rango", () => {
    const totals = summarize([
      day("2026-07-29", { words: 30 }),
      day("2026-07-31", { words: 70 }),
    ]);

    expect(totals.bestDayWords).toBe(70);
  });
});
