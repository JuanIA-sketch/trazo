import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import {
  commands,
  events,
  type ActivityMap as ActivityMapData,
} from "@/bindings";
import {
  buildActivityWeeks,
  summarize,
  type ActivityCell,
} from "./activityGrid";

/** 13 semanas: el trimestre entra en el ancho del panel sin hacer scroll. */
const WINDOW_DAYS = 91;

/**
 * Intensidad por nivel. Se apoya en `logo-primary` para que el mapa siga la
 * paleta en claro y en oscuro sin fijar hexadecimales.
 */
const LEVEL_CLASS: Record<ActivityCell["level"], string> = {
  0: "bg-mid-gray/15",
  1: "bg-logo-primary/25",
  2: "bg-logo-primary/45",
  3: "bg-logo-primary/70",
  4: "bg-logo-primary",
};

interface StatProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const Stat: React.FC<StatProps> = ({ label, value, icon }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide text-mid-gray">
      {label}
    </span>
    <span className="text-lg font-semibold leading-none flex items-center gap-1">
      {icon}
      {value}
    </span>
  </div>
);

export const ActivityMap: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<ActivityMapData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await commands.getActivityMap(WINDOW_DAYS);
      if (result.status === "ok") {
        setData(result.data);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch (error) {
      console.error("Failed to load activity map:", error);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // El mapa se escribe en el mismo camino que el historial, así que el evento
  // de "entrada añadida" es la señal de que hay una celda nueva que pintar.
  useEffect(() => {
    const unlisten = events.historyUpdatePayload.listen((event) => {
      if (event.payload.action === "added") {
        load();
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [load]);

  if (failed) {
    return (
      <div className="px-4 py-3 text-center text-text/60">
        {t("settings.history.activity.error")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-3 text-center text-text/60">
        {t("settings.history.loading")}
      </div>
    );
  }

  const weeks = buildActivityWeeks(data.from_day, data.to_day, data.days);
  const totals = summarize(data.days);
  const numberFormat = new Intl.NumberFormat(i18n.language);

  const tooltipFor = (cell: ActivityCell): string => {
    if (cell.dictations > 0) {
      return t("settings.history.activity.cellTooltip", {
        day: cell.day,
        dictations: cell.dictations,
        words: cell.words,
      });
    }
    if (cell.failed > 0) {
      return t("settings.history.activity.cellFailedTooltip", {
        day: cell.day,
        failed: cell.failed,
      });
    }
    return t("settings.history.activity.cellEmptyTooltip", { day: cell.day });
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <Stat
          label={t("settings.history.activity.streak")}
          value={numberFormat.format(data.streak)}
          icon={
            data.streak > 0 ? (
              <Flame className="w-4 h-4 text-logo-primary" />
            ) : undefined
          }
        />
        <Stat
          label={t("settings.history.activity.dictations")}
          value={numberFormat.format(totals.dictations)}
        />
        <Stat
          label={t("settings.history.activity.words")}
          value={numberFormat.format(totals.words)}
        />
        <Stat
          label={t("settings.history.activity.activeDays")}
          value={numberFormat.format(totals.activeDays)}
        />
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((cell, dayIndex) =>
              cell === null ? (
                <div key={dayIndex} className="w-[11px] h-[11px]" />
              ) : (
                <div
                  key={dayIndex}
                  title={tooltipFor(cell)}
                  className={`w-[11px] h-[11px] rounded-[2px] ${
                    LEVEL_CLASS[cell.level]
                  } ${
                    cell.level === 0 && cell.failed > 0
                      ? "ring-1 ring-inset ring-mid-gray/60"
                      : ""
                  }`}
                />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-mid-gray">
        <span>{t("settings.history.activity.less")}</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <div
            key={level}
            className={`w-[11px] h-[11px] rounded-[2px] ${LEVEL_CLASS[level]}`}
          />
        ))}
        <span>{t("settings.history.activity.more")}</span>
      </div>
    </div>
  );
};
