# Cómo leer el ZIP de Claude Design

> Guía para montar el diseño sin pelearse con el formato.
> Escrita después de traducir la mitad a mano; lo que sigue es lo que aprendí.

---

## 1. Qué hay adentro

Los `.dc.html` **no son HTML plano**: son componentes en el DSL propio de Claude
Design. Abrirlos en el navegador no muestra nada útil.

**Páginas** (tableros de presentación, para mirar y decidir):

| Archivo                              | Contenido                           |
| ------------------------------------ | ----------------------------------- |
| `00 · Material.dc.html`              | La hoja de especímenes del material |
| `01 · App.dc.html`                   | Las pantallas del producto          |
| `02 · Tu trazo.dc.html`              | El tablero de actividad             |
| `03 · Primera vez y overlay.dc.html` | Onboarding y overlay                |
| `04 · Sidebar.dc.html`               | El sidebar en sus estados           |
| `99 · Archivo.dc.html`               | Descartes, no montar                |

**Componentes** (lo que de verdad sirve para montar):

| Archivo            | Qué monta                                            |
| ------------------ | ---------------------------------------------------- |
| `Shell.dc.html`    | ⭐ **El más importante.** Marco, fondo, y LOS TOKENS |
| `Sidebar.dc.html`  | El sidebar                                           |
| `HeyTrazo.dc.html` | El bloque de la palabra de activación                |
| `Pantalla.dc.html` | El contenido: paneles, filas, controles              |
| `Tablero.dc.html`  | El tablero de actividad                              |

**Assets** en `assets/`: `isotipo-trazo.png` (34 KB), `trazito.png` (52 KB),
`corona.png`, más los fondos generados.

## 2. Dónde están los tokens (esto es lo que ahorra el día)

En `Shell.dc.html` hay un método `tokens(claro)` que devuelve un objeto con ~60
variables, **en los dos temas**:

```js
tokens(claro) {
  return claro ? { 'e0': '...', 'sb-bg': '#FFFFFF', ... }
               : { 'e0': '...', 'sb-bg': 'linear-gradient(...)', ... }
}
```

**Ya está traducido** a custom properties de CSS en `src/styles/material.css`,
en esta misma rama. No hace falta volver a extraerlo. Los nombres se
conservaron igual (`--e0`, `--sb-bg`, `--p1-bg`…) para poder cotejar contra el
tablero sin traducir cabezas.

Diccionario de prefijos:

```
e0    fondo de la app        fr-  marco de ventana      tb-  barra de título
sb-   sidebar                nv-  ítem de navegación    p1-  panel nivel 1
p2-   panel nivel 2          pf-  panel destacado       wl-  riel hundido
cg-   chip de ícono grupo    cr-  chip de ícono fila    kb-  tecla / atajo
pg-   barra de progreso      dt-  punto de señal        bd-  insignia
t1..t4  texto (primario → decoración)                   ac-  acento
cta-  llamada a la acción    sw-  interruptor           tg-  selector de tema
mp-   píldora del modelo     ok-  estado correcto
```

## 3. Cómo se traduce el DSL a React

| DSL                                 | React                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `<sc-if value="{{ x }}">`           | `{x && (...)}`                                                             |
| `<sc-for list="{{ xs }}" as="i">`   | `{xs.map(i => ...)}`                                                       |
| `<dc-import name="HeyTrazo" …>`     | `<HeyTrazo … />`                                                           |
| `style="{{ nombre }}"`              | El objeto está en la clase `Component` del `<script>` al final del archivo |
| `<svg><use href="#ic-home"/></svg>` | El equivalente de `lucide-react`                                           |
| `ref="{{ setEl }}"`                 | `useRef`                                                                   |
| `onMouseEnter="{{ enter }}"`        | `onMouseEnter={...}`                                                       |

Los valores de estilo **no están en el markup**: están calculados en la clase
`Component` al final de cada archivo. Para ver un estilo concreto, buscar su
nombre ahí.

## 4. Las reglas del sistema que no se ven en el markup

Salieron de las decisiones tomadas durante el diseño. Si se rompen, el
resultado se ve mal aunque los valores estén bien:

1. **El borde en degradado (`--pf-bd`) se usa UNA vez por pantalla.** Es lo que
   marca qué es lo importante. Dos veces y deja de significar nada.
2. **El grano va en una capa fija**, nunca dentro del contenedor con scroll. Si
   scrollea, el ruido se mueve con el contenido y se lee como interferencia.
3. **El tema claro no es el oscuro con otros colores.** En oscuro la profundidad
   se hace con luz emitida (superficie más clara, brillo interior, glow); en
   claro con luz ocluida (sombra real). Por eso en claro los glow valen `none`.
4. **El cian `#22D3EE` sobre fondo claro da 1.74:1** — muy por debajo de AA. En
   claro, todo cian que sea texto o trazo de menos de 6px pasa a `#0E7490`. El
   `#22D3EE` en claro solo sobrevive como extremo de degradado dentro de
   rellenos gruesos.
5. **Una sola curva de movimiento** en toda la app:
   `cubic-bezier(0.22, 1, 0.36, 1)`. El loop ambiente es de 2200 ms. Las dos ya
   estaban validadas en el overlay antes de este rebrand.
6. **Nunca animar** `width`, `height`, `box-shadow`, `filter` ni
   `background-position`. Solo `transform` y `opacity`.

## 5. Restricciones del proyecto que el diseño no conoce

- **Tailwind v4, sin `tailwind.config.js`.** Es configuración por CSS: un token
  nuevo se define en `theme.css` (o `material.css`) y se registra en el bloque
  `@theme inline` de `App.css`. Solo entonces existe como utilidad.
- **21 locales y ESLint bloquea strings sueltos en JSX.** Cada texto visible
  cuesta una clave en 21 archivos. `bun run check:translations` corre en CI y
  hace `process.exit(1)` si falta una. Con `fallbackLng: "en"`, alcanza con
  poner el texto real en `es` y `en` y el inglés en el resto.
- **`src/bindings.ts` es generado** por tauri-specta. No editarlo.
- **`CARGO_TARGET_DIR=D:\h`**, no `C:` — está al 93% y el build no entra.

## 6. Dos secciones del diseño no existen en el código

**Inicio** y **Actividad** están dibujadas pero no son fachada: son features.
Actividad además necesita la tabla `insights_daily` (ver `PARA-JUAN.md` §5.3).

## 7. Qué está montado y qué no

**Montado** en `feat/rebrand-material`:

- `material.css` con los ~60 tokens en claro y oscuro
- Fondo de la app: malla de tres radiales + capa de grano
- Sidebar: superficie propia, marca de agua, ítem activo con riel
- Las tres categorías (Dictado / Tu voz / Ajustes)
- El bloque de Hey Trazo, cableado a `always_on_microphone`
- 6 claves nuevas × 21 locales

**Sin montar** — es la mayor parte:

- **Todo el área de contenido.** General, Modelos, Avanzado, Historial y Acerca
  de heredan el fondo nuevo pero sus paneles siguen planos: no usan `p1`/`p2`/
  `pf`, ni los chips de ícono, ni las teclas, ni las barras de progreso.
- **La franja inferior** con el modelo y "Buscar actualizaciones" sigue ahí; el
  diseño la elimina y mueve el modelo al pie del sidebar.
- **El control de colapso** del sidebar (borde arrastrable + botón chevron).
- **Los tres anchos** (680 / 1100 / 1400) y el cambio de tamaño de ventana.
- **El isotipo** reemplazando el wordmark.
- **El overlay con borde reactivo.**

Los tokens ya están disponibles, así que aplicar el resto es reemplazar clases,
no diseñar nada nuevo.
