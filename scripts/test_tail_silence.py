# /// script
# requires-python = ">=3.10"
# ///
"""Tests de `tail_silence.py`.

El script decide si merece la pena cambiar el default de
`extra_recording_buffer_ms`, así que su umbral tiene que estar probado: si
midiera de más, concluiríamos "hay silencio de sobra" sobre grabaciones que en
realidad se cortan en seco, que es justo el error que arruinaría la decisión.

Ejecutar:  python scripts/test_tail_silence.py
"""
import math
import os
import struct
import sys
import tempfile
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tail_silence import trailing_silence_ms  # noqa: E402

SR = 16000


def _write(path, segments):
    """Escribe un WAV mono 16 bits a partir de (duración_ms, amplitud)."""
    frames = []
    for dur_ms, amp in segments:
        n = int(SR * dur_ms / 1000)
        for i in range(n):
            # 200 Hz: onda audible, no un DC que el RMS no distinguiría
            frames.append(int(amp * math.sin(2 * math.pi * 200 * i / SR)))
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(struct.pack("<%dh" % len(frames), *frames))


def _tmp(name):
    return os.path.join(tempfile.gettempdir(), name)


def check(nombre, obtenido, esperado, tol):
    ok = obtenido is not None and abs(obtenido - esperado) <= tol
    print(f"  {'OK  ' if ok else 'FALLA'}  {nombre}: {obtenido} ms (esperado {esperado} ±{tol})")
    return ok


def main():
    fallos = 0

    # 1. Caso normal: voz y luego silencio. Es lo que se ve en las grabaciones
    #    reales y lo que haría innecesario el buffer extra.
    p = _tmp("ts_con_cola.wav")
    _write(p, [(1000, 8000), (500, 0)])
    if not check("500 ms de silencio tras la voz", trailing_silence_ms(p), 500, 30):
        fallos += 1

    # 2. Corte en seco: la voz llega hasta el último sample. Es el caso que el
    #    script TIENE que distinguir del anterior; si lo confundiera, daríamos
    #    por bueno un audio truncado.
    p = _tmp("ts_cortado.wav")
    _write(p, [(1000, 8000)])
    if not check("corte en seco", trailing_silence_ms(p), 0, 30):
        fallos += 1

    # 3. Cola larga.
    p = _tmp("ts_cola_larga.wav")
    _write(p, [(800, 8000), (2000, 0)])
    if not check("2000 ms de cola", trailing_silence_ms(p), 2000, 40):
        fallos += 1

    # 4. Ruido de fondo en vez de silencio digital: el umbral no puede depender
    #    de que la cola sea exactamente cero, porque un micro real nunca lo es.
    p = _tmp("ts_con_ruido.wav")
    _write(p, [(1000, 8000), (600, 120)])
    if not check("600 ms de ruido de fondo", trailing_silence_ms(p), 600, 40):
        fallos += 1

    # 5. Solo silencio: no hay voz que medir, debe decirlo en vez de inventar.
    p = _tmp("ts_mudo.wav")
    _write(p, [(1000, 0)])
    r = trailing_silence_ms(p)
    ok = r is None
    print(f"  {'OK  ' if ok else 'FALLA'}  clip sin voz devuelve None: {r}")
    if not ok:
        fallos += 1

    # 6. Clic de la tecla al final. Caso real: en handy-1785365965.wav la
    #    herramienta dio "0 ms de cola" y Charly confirmó al oírlo que era el
    #    clic de soltar la tecla, no una palabra. Un transitorio corto no puede
    #    contar como voz o daremos por truncados clips que están completos.
    p = _tmp("ts_clic_final.wav")
    _write(p, [(1000, 8000), (500, 0), (30, 2000), (100, 0)])
    if not check("clic corto al final se ignora", trailing_silence_ms(p), 630, 40):
        fallos += 1

    # 7. Clic pegado al final, sin nada detrás: el caso exacto del clip real.
    p = _tmp("ts_clic_al_borde.wav")
    _write(p, [(1000, 8000), (500, 0), (30, 2000)])
    if not check("clic en el ultimo sample se ignora", trailing_silence_ms(p), 530, 40):
        fallos += 1

    # 8. Contrapeso del arreglo anterior: una palabra final CORTA pero real
    #    tiene que seguir contando. Si al ignorar clics nos cargáramos esto,
    #    pasaríamos a no detectar nunca un truncado de verdad.
    p = _tmp("ts_palabra_corta.wav")
    _write(p, [(1000, 8000), (300, 0), (120, 6000), (200, 0)])
    if not check("palabra final corta SI cuenta", trailing_silence_ms(p), 200, 40):
        fallos += 1

    print()
    if fallos:
        print(f"{fallos} test(s) fallando")
        return 1
    print("todos los tests pasan")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
