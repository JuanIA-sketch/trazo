/** Geometría del borde reactivo del overlay.
 *
 * El contorno de la píldora deja de ser una línea constante y pasa a respirar
 * con la voz: es la tesis de marca llevada al objeto —el trazo es la marca que
 * deja tu voz—, así que el borde del objeto de marca es el trazo.
 *
 * Todo aquí es puro y sin DOM: recibe medidas y amplitudes, devuelve puntos y
 * un `d` de SVG. El bucle por frame vive en el componente.
 *
 * Dos reglas del diseño que este módulo garantiza:
 *   - La onda va SIEMPRE hacia adentro. La ventana del overlay es solo 36 px
 *     más ancha que la píldora y 11 px más alta por abajo; hacia afuera se
 *     recortaría contra el borde de la ventana.
 *   - La amplitud es máxima junto a la corona y decae hacia el punto opuesto:
 *     la corona no se esquiva, emite.
 */

export interface Punto {
  x: number;
  y: number;
}

export interface OpcionesDeformacion {
  /** Amplitud 0..1 por muestra, del mismo largo que el contorno. */
  amplitudes: number[];
  /** Índice del contorno donde vive la corona (origen de la señal). */
  origen?: number;
  /** Desplazamiento máximo hacia adentro, en px, con amplitud 1. */
  maximo?: number;
  /** Cuánto conserva el punto opuesto a la corona, 0..1. */
  minimoDecaimiento?: number;
}

/** Muestrea el contorno de un rectángulo redondeado, en sentido horario. */
export const contornoPildora = (
  ancho: number,
  alto: number,
  radio: number,
  muestras: number,
): Punto[] => {
  const r = Math.max(0, Math.min(radio, Math.min(ancho, alto) / 2));
  const rectoH = Math.max(0, ancho - 2 * r);
  const rectoV = Math.max(0, alto - 2 * r);
  const arco = (Math.PI / 2) * r;
  const total = 2 * rectoH + 2 * rectoV + 4 * arco;

  const puntos: Punto[] = [];
  for (let i = 0; i < muestras; i++) {
    let s = total === 0 ? 0 : (i / muestras) * total;

    // Arriba, de izquierda a derecha.
    if (s < rectoH) {
      puntos.push({ x: r + s, y: 0 });
      continue;
    }
    s -= rectoH;
    if (s < arco) {
      const a = arco === 0 ? 0 : (s / arco) * (Math.PI / 2);
      puntos.push({
        x: ancho - r + r * Math.sin(a),
        y: r - r * Math.cos(a),
      });
      continue;
    }
    s -= arco;
    if (s < rectoV) {
      puntos.push({ x: ancho, y: r + s });
      continue;
    }
    s -= rectoV;
    if (s < arco) {
      const a = arco === 0 ? 0 : (s / arco) * (Math.PI / 2);
      puntos.push({
        x: ancho - r + r * Math.cos(a),
        y: alto - r + r * Math.sin(a),
      });
      continue;
    }
    s -= arco;
    if (s < rectoH) {
      puntos.push({ x: ancho - r - s, y: alto });
      continue;
    }
    s -= rectoH;
    if (s < arco) {
      const a = arco === 0 ? 0 : (s / arco) * (Math.PI / 2);
      puntos.push({
        x: r - r * Math.sin(a),
        y: alto - r + r * Math.cos(a),
      });
      continue;
    }
    s -= arco;
    if (s < rectoV) {
      puntos.push({ x: 0, y: alto - r - s });
      continue;
    }
    s -= rectoV;
    const a = arco === 0 ? 0 : (s / arco) * (Math.PI / 2);
    puntos.push({ x: r - r * Math.cos(a), y: r - r * Math.sin(a) });
  }
  return puntos;
};

/** Empuja cada punto hacia el centro según su amplitud y su distancia a la corona. */
export const deformarHaciaAdentro = (
  contorno: Punto[],
  {
    amplitudes,
    origen = 0,
    maximo = 6,
    minimoDecaimiento = 0.25,
  }: OpcionesDeformacion,
): Punto[] => {
  const n = contorno.length;
  if (n === 0) return [];

  const cx = contorno.reduce((s, p) => s + p.x, 0) / n;
  const cy = contorno.reduce((s, p) => s + p.y, 0) / n;

  return contorno.map((p, i) => {
    // Distancia angular a la corona, normalizada 0..1 (0 = en la corona).
    const bruto = Math.abs(i - origen);
    const circular = Math.min(bruto, n - bruto) / (n / 2);
    const ventana =
      minimoDecaimiento + (1 - minimoDecaimiento) * (1 - circular);

    const amplitud = Math.max(0, Math.min(1, amplitudes[i] ?? 0));
    const empuje = amplitud * ventana * maximo;
    if (empuje === 0) return { x: p.x, y: p.y };

    const dx = cx - p.x;
    const dy = cy - p.y;
    const largo = Math.hypot(dx, dy);
    if (largo === 0) return { x: p.x, y: p.y };

    // Nunca pasa del centro: la onda entra, no atraviesa.
    const paso = Math.min(empuje, largo);
    return { x: p.x + (dx / largo) * paso, y: p.y + (dy / largo) * paso };
  });
};

/** Convierte los puntos en un `d` cerrado, redondeando para no ensuciar el DOM. */
export const rutaSvg = (puntos: Punto[]): string => {
  if (puntos.length === 0) return "";
  const n = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
  let d = `M${n(puntos[0].x)},${n(puntos[0].y)}`;
  for (let i = 1; i < puntos.length; i++) {
    d += `L${n(puntos[i].x)},${n(puntos[i].y)}`;
  }
  return d + "Z";
};
