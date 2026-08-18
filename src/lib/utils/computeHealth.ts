import type { ActiveComputeInfo } from "@/bindings";

/** Lo que la interfaz debe contar sobre el dispositivo de cómputo activo. */
export type ComputeNotice =
  | { kind: "ok" }
  /** El usuario había elegido una GPU y esa GPU ya no existe. */
  | { kind: "lost-gpu"; lostDevice: number; runningOn: string }
  /** Se pidió acelerador y la carga acabó en CPU. */
  | { kind: "cpu-fallback"; runningOn: string };

/**
 * Decide qué avisar a partir del estado que reporta el backend.
 *
 * Existe como función pura, y no dentro del componente, porque la regla que
 * importa es una regla de producto, no de pintado: **avisar solo cuando el
 * usuario perdió algo que había elegido**. Un equipo sin GPU dedicada corre en
 * la integrada desde el primer día y eso no es una degradación; avisarle sería
 * ruido permanente que enseña a ignorar el aviso.
 *
 * El caso que motiva todo esto es el incidente del 2026-08-17: la GTX 1650
 * desapareció del bus PCI, la transcripción pasó de ~11x a ~0,5x tiempo real y
 * durante 18 horas el único rastro fue una línea de log.
 */
export function computeNotice(info: ActiveComputeInfo | null): ComputeNotice {
  if (!info) return { kind: "ok" };

  const runningOn = info.device_name ?? info.bound_backend;

  // La GPU perdida manda sobre la caída a CPU: es más específica y dice qué
  // hacer (recuperar ese dispositivo), mientras que "estás en CPU" no.
  if (info.lost_gpu_device !== null) {
    return { kind: "lost-gpu", lostDevice: info.lost_gpu_device, runningOn };
  }
  if (info.is_cpu_fallback) {
    return { kind: "cpu-fallback", runningOn };
  }
  return { kind: "ok" };
}
