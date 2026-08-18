import { describe, expect, it } from "bun:test";
import { computeNotice } from "./computeHealth";
import type { ActiveComputeInfo } from "@/bindings";

const sano: ActiveComputeInfo = {
  requested_backend: "Vulkan",
  bound_backend: "Vulkan1",
  device_name: "NVIDIA GeForce GTX 1650",
  is_cpu_fallback: false,
  lost_gpu_device: null,
};

describe("computeNotice", () => {
  it("no avisa nada cuando la carga usó la GPU elegida", () => {
    expect(computeNotice(sano)).toEqual({ kind: "ok" });
  });

  /**
   * Incidente del 2026-08-17. La GTX 1650 se cayó del bus PCI (error 43 de
   * Windows), transcribe-cpp pasó a enumerar un solo dispositivo Vulkan y la
   * carga cayó a la iGPU Intel. El dictado pasó de ~11x a ~0,5x tiempo real y
   * estuvo así 18 horas sin una sola señal en pantalla.
   */
  it("avisa cuando la GPU elegida desapareció", () => {
    const degradado: ActiveComputeInfo = {
      ...sano,
      bound_backend: "Vulkan0",
      device_name: "Intel(R) UHD Graphics",
      lost_gpu_device: 1,
    };

    expect(computeNotice(degradado)).toEqual({
      kind: "lost-gpu",
      lostDevice: 1,
      runningOn: "Intel(R) UHD Graphics",
    });
  });

  it("avisa cuando se pidió acelerador y se acabó en CPU", () => {
    expect(
      computeNotice({
        ...sano,
        bound_backend: "CPU",
        device_name: null,
        is_cpu_fallback: true,
      }),
    ).toEqual({ kind: "cpu-fallback", runningOn: "CPU" });
  });

  /**
   * Si se perdió la GPU Y además se acabó en CPU, gana el mensaje de la GPU
   * perdida: es el que dice qué se rompió y, por tanto, qué arreglar.
   */
  it("la GPU perdida manda sobre la caída a CPU", () => {
    const notice = computeNotice({
      ...sano,
      bound_backend: "CPU",
      device_name: null,
      is_cpu_fallback: true,
      lost_gpu_device: 1,
    });

    expect(notice.kind).toBe("lost-gpu");
  });

  /**
   * Un equipo sin GPU dedicada corre en la integrada desde el primer día. Eso
   * no es una degradación, y avisarlo sería un aviso permanente — que es la
   * forma más rápida de enseñar al usuario a ignorarlos.
   */
  it("no avisa en un equipo que nunca tuvo GPU dedicada", () => {
    expect(
      computeNotice({
        requested_backend: "Auto",
        bound_backend: "Vulkan0",
        device_name: "Intel(R) UHD Graphics",
        is_cpu_fallback: false,
        lost_gpu_device: null,
      }),
    ).toEqual({ kind: "ok" });
  });

  it("no explota antes de la primera carga de modelo", () => {
    expect(computeNotice(null)).toEqual({ kind: "ok" });
  });

  /** Sin descripción del dispositivo, el nombre del backend es el mejor dato. */
  it("cae al nombre del backend cuando el driver no describe el dispositivo", () => {
    const notice = computeNotice({
      ...sano,
      device_name: null,
      lost_gpu_device: 1,
    });

    expect(notice).toEqual({
      kind: "lost-gpu",
      lostDevice: 1,
      runningOn: "Vulkan1",
    });
  });
});
