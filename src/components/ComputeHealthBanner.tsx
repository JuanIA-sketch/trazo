import { AlertTriangle } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { commands, type ActiveComputeInfo } from "@/bindings";
import { computeNotice } from "@/lib/utils/computeHealth";

/**
 * Aviso de que el dictado se está ejecutando en un dispositivo peor del que el
 * usuario eligió.
 *
 * Existe por el incidente del 2026-08-17: la GPU dedicada desapareció del bus
 * PCI, la transcripción cayó de ~11x a ~0,5x tiempo real y estuvo así 18 horas
 * sin que nada lo dijera. La información ya existía en el backend, pero solo se
 * veía entrando a Ajustes → Avanzado, que es justo donde nadie mira cuando lo
 * único que nota es "esto va lento hoy".
 *
 * Por eso el aviso vive arriba del contenido y no dentro de Ajustes: la señal
 * tiene que ir a buscar al usuario, no al revés.
 */
export const ComputeHealthBanner: FC = () => {
  const { t } = useTranslation();
  const [info, setInfo] = useState<ActiveComputeInfo | null>(null);

  useEffect(() => {
    const refresh = () => {
      commands.getActiveComputeInfo().then(setInfo).catch(console.error);
    };
    refresh();

    // Dos fuentes a propósito. El evento cubre la degradación que ocurre con la
    // ventana ya abierta; la consulta al montar cubre el caso más probable, que
    // es que el modelo se cargara antes de que existiera esta ventana.
    const unlisten = Promise.all([
      listen("compute-degraded", refresh),
      listen("model-state-changed", refresh),
    ]);
    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
    };
  }, []);

  const notice = computeNotice(info);
  if (notice.kind === "ok") return null;

  const message =
    notice.kind === "lost-gpu"
      ? t("computeHealth.lostGpu", { device: notice.runningOn })
      : t("computeHealth.cpuFallback", { device: notice.runningOn });

  return (
    <div
      role="status"
      className="p-4 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-start gap-3"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium">{t("computeHealth.title")}</p>
        <p className="text-sm text-mid-gray">{message}</p>
      </div>
    </div>
  );
};

export default ComputeHealthBanner;
