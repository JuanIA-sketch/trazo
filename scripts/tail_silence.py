# /// script
# requires-python = ">=3.10"
# ///
"""Mide cuánto silencio hay al final de las grabaciones de Trazo.

**Para qué sirve.** Existe la sospecha (bug 2 de §8.8 del traspaso) de que al
soltar la tecla la grabación se corta en seco y Whisper pierde las últimas
palabras. Si eso fuera cierto, los clips terminarían con la voz todavía sonando.
Este script lo comprueba sin necesidad de cargar ningún modelo.

**Cómo leer el resultado.**

- cola ≈ 0 ms  → hay corte en seco: subir `extra_recording_buffer_ms` está
  justificado, porque se está perdiendo audio real.
- cola de varios cientos de ms → el audio llega completo y el buffer extra solo
  añadiría latencia a cada dictado. Si aun así faltan palabras, el problema está
  en la decodificación, no en la captura, y hay que buscarlo en otro sitio.

Medido el 2026-07-30 sobre 25 grabaciones reales en Windows con el default de
0 ms: mediana 1540 ms, mínimo 270 ms, ningún clip por debajo de 100 ms. O sea
que el tiempo de reacción al soltar la tecla ya aporta mucho más margen que los
200-300 ms que se planteaba añadir.

Uso:
    python scripts/tail_silence.py                     # carpeta por defecto
    python scripts/tail_silence.py <carpeta-o-wav>...
    python scripts/test_tail_silence.py                # tests
"""
import math
import os
import struct
import sys
import wave

FRAME_MS = 10

# El umbral se apoya en el fondo de ruido del propio clip, no en un valor
# absoluto, porque cada micro y cada sala tienen el suyo. Los topes evitan los
# dos extremos degenerados: silencio digital perfecto (fondo = 0, que dejaría el
# umbral en cero y haría pasar por voz cualquier cosa) y clip cortado en seco
# (donde el "fondo" ES la voz y el umbral se dispararía hasta ocultar el corte).
FONDO_X = 4.0  # el umbral queda ~12 dB por encima del fondo medido
MIN_REL_VOZ = 0.08  # nunca por debajo de −22 dB respecto a la voz
MAX_REL_VOZ = 0.25  # nunca por encima de −12 dB respecto a la voz

# Duración mínima para que un tramo cuente como voz. Sin esto, el clic de
# soltar la tecla —que el micro capta justo al final— se toma por una palabra y
# el clip parece cortado en seco cuando en realidad está completo. Pasó de
# verdad con handy-1785365965.wav: la herramienta dijo "0 ms de cola" y al
# escucharlo era un clic. Una sílaba real no baja de ~100 ms, así que 60 ms deja
# margen de sobra sin dejar pasar transitorios.
MIN_VOZ_MS = 60


def _frames_rms(path):
    """RMS por trama de 10 ms, la frecuencia de muestreo y la duración."""
    with wave.open(path, "rb") as w:
        n, sr, sw, ch = w.getnframes(), w.getframerate(), w.getsampwidth(), w.getnchannels()
        raw = w.readframes(n)
    if sw != 2:
        raise ValueError(f"solo se admite PCM de 16 bits (este tiene {sw * 8})")
    total = len(raw) // 2
    s = struct.unpack("<%dh" % total, raw[: total * 2])
    if ch > 1:
        s = [sum(s[i : i + ch]) / ch for i in range(0, len(s) - ch + 1, ch)]
    per = max(1, int(sr * FRAME_MS / 1000))
    rms = [
        math.sqrt(sum(v * v for v in s[i : i + per]) / per)
        for i in range(0, len(s) - per + 1, per)
    ]
    return rms, sr, (len(s) / sr if sr else 0.0)


def trailing_silence_ms(path):
    """Milisegundos entre la última voz y el final del archivo.

    Devuelve `None` si el clip no tiene voz reconocible: es preferible a
    devolver un número que parecería una medida buena.
    """
    rms, _sr, _dur = _frames_rms(path)
    if len(rms) < 5:
        return None

    ordenado = sorted(rms)
    voz = ordenado[int(len(ordenado) * 0.90)]
    fondo = ordenado[int(len(ordenado) * 0.10)]
    if voz <= 1e-6:
        return None  # clip mudo

    umbral = max(fondo * FONDO_X, voz * MIN_REL_VOZ)
    umbral = min(umbral, voz * MAX_REL_VOZ)

    # Último tramo CONTINUO por encima del umbral que dure lo suficiente para
    # ser voz. Se recorre hacia atrás y se descarta cualquier racha corta: esas
    # son clics, golpes de mesa o chasquidos, no palabras.
    min_tramas = max(1, MIN_VOZ_MS // FRAME_MS)
    fin = None
    i = len(rms) - 1
    while i >= 0:
        if rms[i] < umbral:
            i -= 1
            continue
        j = i
        while j >= 0 and rms[j] >= umbral:
            j -= 1
        if (i - j) >= min_tramas:  # racha de i..j+1
            fin = i
            break
        i = j  # racha demasiado corta: se ignora y se sigue hacia atrás
    if fin is None:
        return None
    return (len(rms) - 1 - fin) * FRAME_MS


def _wavs(argv):
    if not argv:
        argv = [os.path.expandvars(r"%APPDATA%\com.trazo.app\recordings")]
    salida = []
    for a in argv:
        if os.path.isdir(a):
            salida += [
                os.path.join(a, f) for f in sorted(os.listdir(a)) if f.lower().endswith(".wav")
            ]
        elif a.lower().endswith(".wav"):
            salida.append(a)
    return salida


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    rutas = _wavs(argv)
    if not rutas:
        print("No se encontraron .wav. Pasa una carpeta o archivos como argumento.")
        return 1

    print(f"{'grabación':<28}{'duración':>10}{'cola':>10}")
    print("-" * 48)
    valores = []
    for p in rutas:
        try:
            cola = trailing_silence_ms(p)
            _r, _sr, dur = _frames_rms(p)
        except Exception as e:
            print(f"{os.path.basename(p):<28}  ilegible: {e}")
            continue
        if cola is None:
            print(f"{os.path.basename(p):<28}{dur:>9.1f}s{'sin voz':>10}")
            continue
        valores.append(cola)
        aviso = "   <== CORTE EN SECO" if cola < 100 else ""
        print(f"{os.path.basename(p):<28}{dur:>9.1f}s{cola:>7} ms{aviso}")

    if not valores:
        print("\nNingún clip con voz medible.")
        return 1

    valores.sort()
    print()
    print(f"clips con voz          : {len(valores)}")
    print(f"mínimo                 : {valores[0]} ms")
    print(f"mediana                : {valores[len(valores) // 2]} ms")
    print(f"máximo                 : {valores[-1]} ms")
    print(f"por debajo de 100 ms   : {sum(1 for v in valores if v < 100)}")
    print(f"por debajo de 300 ms   : {sum(1 for v in valores if v < 300)}")
    print()
    if valores[len(valores) // 2] < 100:
        print("=> Corte en seco: subir extra_recording_buffer_ms está justificado.")
    else:
        print("=> Hay cola de sobra: el buffer extra solo añadiría latencia.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
