import React, { useEffect, useRef } from "react";
import { contornoPildora, deformarHaciaAdentro, rutaSvg } from "./borderWave";

const MUESTRAS = 72;
const RADIO = 24; // el mismo radio que `.scard` en el CSS
const SUAVIZADO = 0.35; // interpolación entre frames: sin esto tiembla

interface Props {
  /** Niveles del micrófono (evento `mic-level`), 0..1. */
  niveles: number[];
  /** El VAD dice que hay voz: el borde se enciende. */
  hablando: boolean;
  /** Transcribiendo: el borde deja de ondular y pasa a arco viajero. */
  trabajando: boolean;
  /** Solo dibuja mientras el overlay está a la vista. */
  activo: boolean;
}

/**
 * El contorno de la píldora ES el visualizador.
 *
 * Sustituye a la "T" serif: el pulso de voz que vivía en la letra ahora vive en
 * el borde, y el indicador de progreso de transcripción es un arco que orbita
 * saliendo de debajo de la corona.
 *
 * Nunca corre en reposo: la app está abierta todo el día y esto es un
 * `requestAnimationFrame` continuo.
 */
export const ReactiveBorder: React.FC<Props> = ({
  niveles,
  hablando,
  trabajando,
  activo,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const nivelesRef = useRef<number[]>([]);
  const suavesRef = useRef<number[]>(new Array(MUESTRAS).fill(0));
  const trabajandoRef = useRef(false);

  nivelesRef.current = niveles;
  trabajandoRef.current = trabajando;

  useEffect(() => {
    if (!activo) return;
    const host = hostRef.current;
    const path = pathRef.current;
    if (!host || !path) return;

    let raf = 0;
    let vivo = true;

    const dibujar = () => {
      if (!vivo) return;
      const { width, height } = host.getBoundingClientRect();
      if (width > 0 && height > 0) {
        const base = contornoPildora(width, height, RADIO, MUESTRAS);

        const objetivo = new Array(MUESTRAS);
        const fuente = nivelesRef.current;
        for (let i = 0; i < MUESTRAS; i++) {
          if (trabajandoRef.current || fuente.length === 0) {
            objetivo[i] = 0;
          } else {
            // Reparte los niveles disponibles a lo largo del contorno.
            objetivo[i] =
              fuente[Math.floor((i / MUESTRAS) * fuente.length)] ?? 0;
          }
        }

        const suaves = suavesRef.current;
        for (let i = 0; i < MUESTRAS; i++) {
          suaves[i] += (objetivo[i] - suaves[i]) * SUAVIZADO;
        }

        path.setAttribute(
          "d",
          rutaSvg(
            deformarHaciaAdentro(base, { amplitudes: suaves, origen: 0 }),
          ),
        );
      }
      raf = requestAnimationFrame(dibujar);
    };

    raf = requestAnimationFrame(dibujar);
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
    };
  }, [activo]);

  return (
    <div
      ref={hostRef}
      className={`sborde ${hablando ? "is-voz" : ""} ${trabajando ? "is-trabajando" : ""}`}
      aria-hidden="true"
    >
      <svg className="sborde-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sborde-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path ref={pathRef} className="sborde-path" fill="none" />
      </svg>
    </div>
  );
};
