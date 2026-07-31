# Para Juan — montaje del rebrand

> Rama: `feat/rebrand-material`, sacada de tu `main` (`bda16cc`).
> Verificado el 2026-07-31. **No commiteado todavía.**

---

## 1. Lo primero: qué NO toqué

Tus 33 commits de esta semana están intactos. El formalizador de correo, la
corrección de palabras desde el Historial, el diccionario de reemplazos y las
migraciones v7/v8 no los rocé.

En `Sidebar.tsx`, que es el único componente tuyo que cambié, **la lógica quedó
igual**: `SECTIONS_CONFIG` conserva sus entradas, sus `enabled` y sus
`component`; los props y el handler son los mismos. Lo que cambió es el JSX de
presentación y un campo nuevo por sección (`group`) que solo agrupa visualmente.

Cero cambios en Rust. Cero cambios en `bindings.ts`.

## 2. Estado de verificación

```
bun run build              ✓ built in 4.99s
bun test src/              ✓ 56 pass · 0 fail
bun run lint               ✓ sin errores
bun run check:translations ✓ All 20 languages complete
```

**Lo que NO verifiqué:** no levanté la app hasta el final del trabajo, así que
todo lo de arriba dice "compila y pasa los chequeos", no "se ve bien corriendo".

## 3. Archivos

**Nuevos**

| Archivo | Qué es |
| --- | --- |
| `src/styles/material.css` | ~60 tokens de material (superficies, elevación, bordes en degradado) en claro y oscuro |
| `src/components/Sidebar.css` | Superficie del sidebar, marca de agua, ítem activo con riel |
| `src/components/HeyTrazo.tsx` | El bloque de la palabra de activación |
| `src/components/HeyTrazo.css` | Su material y sus estados |
| `src/assets/trazito.png` | La mascota (52 KB) |

**Modificados**

| Archivo | Qué |
| --- | --- |
| `src/App.css` | +41 líneas: importa el material, malla de fondo, capa de grano |
| `src/components/Sidebar.tsx` | Clases + campo `group` + render agrupado + `<HeyTrazo/>` |
| `src/i18n/locales/*/translation.json` | 6 claves nuevas × 21 locales |
| `CLAUDE.md` | Correcciones de documentación (ver §6) |
| `src/overlay/RecordingOverlay.css` | Solo comentarios: describían el diseño morado viejo |

## 4. Las claves de traducción

Seis claves nuevas: `sidebar.group.{dictation,voice,settings}` y
`heyTrazo.{idle,listening,privacy}`.

Puse el texto real en **es** y **en**. Los otros 19 idiomas recibieron el
inglés — que es exactamente lo que renderizaría el fallback (`fallbackLng: "en"`
en `src/i18n/index.ts:79`), así que no inventé traducciones que no puedo
verificar. `check:translations` pasa. Un traductor las completa sin tocar código.

## 5. LO QUE TE TOCA A VOS

### 5.1 «Hey Trazo» — el commit que falta

El bloque de la interfaz **ya está cableado a `always_on_microphone`**
(`settings.rs:400`), que es literalmente lo que la función necesita: el
micrófono abierto esperando. No inventé un estado local: apretar el control
escribe ese ajuste de verdad.

Cuando subas la detección de la frase, **no hace falta tocar la interfaz**:
tiene que leer esa misma bandera y ya.

⚠️ **Mientras tanto**, encender ese control deja el micrófono abierto sin que
nada escuche la frase. Consume sin dar nada a cambio. Si se graba el video demo
antes de tu commit, va apagado.

Tres estados están diseñados; dos están montados:

| Estado | Copy | Montado |
| --- | --- | --- |
| Apagado | `Activar «Hey Trazo»` | ✅ |
| Escuchando | `Di «Hey Trazo»` + línea de privacidad | ✅ |
| Detectado | pulso de Trazito + `Te escucho…` | ❌ falta el evento del backend |

Para el tercero necesito un evento cuando se detecta la frase. Con eso el
personaje pulsa y la tarjeta destella ~1s. Es el instante que demuestra que la
función anda, y es el que va al video.

### 5.2 La ventana abre demasiado chica

`src-tauri/src/lib.rs:840`:

```rust
.inner_size(680.0, 570.0)
.min_inner_size(680.0, 570.0)
.maximizable(false)
```

Abre en 680×570 y **no se puede maximizar**. Con la sidebar de 160px quedan
473px útiles. El contenido está limitado a `max-w-3xl` (768px) y centrado, así
que al agrandar la ventana la app queda mayormente vacía.

Propuesta: `inner_size(1100, 720)`, `min_inner_size(680, 570)`,
`maximizable(true)`. Son tres valores y cambia por completo la primera
impresión.

### 5.3 Si quieren la sección Actividad

El mapa de actividad diaria necesita una tabla de contadores. **El historial se
poda a 20 entradas** (`settings.rs:575` + `history.rs:265` llama a
`cleanup_old_entries()` en cada dictado), así que cualquier métrica "de por
vida" calculada sobre `transcription_history` es falsa.

```sql
CREATE TABLE IF NOT EXISTS insights_daily (
  day             TEXT PRIMARY KEY,             -- 'YYYY-MM-DD' chrono::Local, congelado
  dictations      INTEGER NOT NULL DEFAULT 0,   -- solo los que produjeron texto
  failed          INTEGER NOT NULL DEFAULT 0,
  words           INTEGER NOT NULL DEFAULT 0,   -- sobre transcription_text
  words_added     INTEGER NOT NULL DEFAULT 0,   -- delta del post-procesado
  post_processed  INTEGER NOT NULL DEFAULT 0,
  max_words       INTEGER NOT NULL DEFAULT 0,
  profile_hist    TEXT    NOT NULL DEFAULT '{}' -- {prompt_id: count}
);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON transcription_history(timestamp);
```

Tres cosas que rompen el mapa si se hacen mal:

1. **El UPSERT va ANTES de `cleanup_old_entries()`** (`history.rs:265`). Si va
   después, el mapa nunca tiene más de dos días.
2. **Va FUERA del candado `if wav_saved`** (`actions.rs:740` y `:821`). Si el
   WAV no verifica, el dictado igual ocurrió y se pegó.
3. **`dictations` solo cuenta entradas con `words > 0`.** Hoy las
   transcripciones fallidas se guardan con texto vacío; si cuentan, mantienen
   viva la racha y pintan la celda con nada adentro.

## 6. Documentación que estaba mintiendo

Corregido en `CLAUDE.md`:

- **La paleta.** Los puntos 8 y 12 decían morado `#7B2FBE` + naranja `#F97316`.
  El código está en azul `#2563EB` + cian `#22D3EE` hace rato. Dejé una
  advertencia explícita para que nadie "restaure" el morado.
- **El punto 12** decía "pill negro sólido #000"; el CSS real es
  `linear-gradient(180deg,#020617,#0B1220)`.
- **Los pendientes del punto 8** listaban iconos de app, `identifier` y
  `productName` como faltantes. Los tres están hechos: `tauri.conf.json` ya dice
  `productName: "Trazo"` e `identifier: "com.trazo.app"`.
- **`CARGO_TARGET_DIR`** decía `C:\h`. El build real vive en **`D:\h`**, y `C:`
  está al 93% con ~17 GB libres: ahí no entra. `BUILD.md:181` todavía dice
  `C:\h`, pero ahí es un ejemplo genérico de la doc de upstream y lo dejé.

También corregí comentarios en `RecordingOverlay.css` que describían el borde
morado/naranja y el fondo negro del diseño viejo.

## 7. Lo que NO está montado

El diseño cubre más de lo que entró. Falta:

- **El control de colapso** del sidebar (borde arrastrable + botón chevron)
- **Los tres anchos** (680 / 1100 / 1400) — depende de §5.2
- **El isotipo** reemplazando el wordmark: `HandyTextLogo` sigue con placeholder
- **Las secciones Inicio y Actividad** — no existen en el código
- **El borde reactivo del overlay** — diseñado, sin montar
- **Los paneles del resto de pantallas**: General, Modelos, Avanzado, Historial
  y Acerca de heredan el fondo nuevo, pero sus tarjetas todavía no usan las
  recetas `p1`/`p2`/`pf` de `material.css`

Los tokens ya están disponibles, así que aplicarlos es cuestión de reemplazar
clases, no de diseñar nada nuevo.

---

## 8. Aviso: esto es la base, no el diseño terminado

Charly revisó el resultado montado y su veredicto fue directo: **no se parece
al diseño**. Tiene razón, y conviene que lo sepas antes de abrir la rama.

Lo que hay acá son **los cimientos**: el pliego de tokens traducido del formato
de Claude Design a CSS, el sidebar, y las locales resueltas. El área de
contenido —que es la mayor parte de lo que se ve— sigue siendo la de siempre
con otros colores.

**El diseño completo vive en el ZIP de Claude Design**, no en esta rama. La
guía para leerlo está en `GUIA-DSL-CLAUDE-DESIGN.md`: dónde están los tokens,
cómo se traduce el DSL a React, y las seis reglas del sistema que no se ven en
el markup pero que si se rompen arruinan el resultado.

Lo más caro ya está hecho: extraer los ~60 tokens del DSL. El resto es aplicar
clases.
