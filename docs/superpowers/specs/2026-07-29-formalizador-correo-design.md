# Formalizador de correo — diseño

**Fecha:** 2026-07-29 · **Estado:** aprobado por Charly (2026-07-29)

## Objetivo

Dictar en tono casual y obtener un correo presentable: saludo, cuerpo
reestructurado, despedida y firma, con el tratamiento (tú/usted) que el usuario
haya fijado. Es la segunda de las dos features priorizadas para la entrega del
31 de julio; el diccionario de reemplazos ampliado va en su propia spec y en su
propio ciclo.

No es infraestructura nueva: reutiliza el post-procesado con LLM que ya existe
(`post_process_transcription` en `actions.rs`) y el sistema de atajos ya
construido. Lo que se añade es un perfil sembrado, un binding, tres ajustes y
dos funciones puras.

## Decisiones y su porqué

Cada una salió de una pregunta concreta durante el diseño; se documentan con su
alternativa descartada para que no se reabran sin motivo.

### Atajo propio, no cambiar el perfil en Ajustes

Hoy el disparo del post-procesado es un atajo
(`transcribe_with_post_process`), pero **qué prompt se ejecuta lo decide un
único valor global**, `post_process_selected_prompt_id`. Sin un atajo propio, el
flujo real sería: Ajustes → cambiar perfil → dictar → Ajustes → dejarlo como
estaba. Eso se come el beneficio de la feature, y afecta cada vez a quien tenga
`default_es_casual` seleccionado para el día a día (el caso de Charly).

**Descartado:** un selector rápido de perfil en la bandeja o el overlay. Es UI
nueva y sigue siendo un paso antes de cada dictado.

### Tratamiento tú/usted: ajuste fijo, no inferido

En español la formalidad atraviesa la gramática: tú/usted cambia cada verbo del
mensaje. Si el perfil elige mal, la salida hay que reescribirla a mano, que es
justo lo que la feature venía a evitar.

Un ajuste con dos valores es **determinista y testeable**: la misma entrada da
siempre el mismo tratamiento.

**Descartado:** dejar que el LLM lo infiera del contenido. El mismo dictado
podría salir tuteado o de usted en dos intentos, y eso no se puede cubrir con
tests.

### Destinatario del dictado; hora calculada en Rust

El saludo se parte en dos responsabilidades:

- **La hora la calcula Rust** y se le pasa ya resuelta al prompt
  (`${saludo}` = "Buenos días" | "Buenas tardes" | "Buenas noches"). Determinista
  y con tests de límites.
- **A quién saluda lo decide el LLM**, extrayéndolo del dictado si se menciona
  ("dile a María que el deploy se retrasa" → "Buenos días, María:"). Si no se
  menciona a nadie, saludo genérico.

**Límite aceptado:** es la hora local de quien dicta, no la del destinatario.
Conocer la del otro exigiría pedirla a mano y no lo vale. Dictar a las 21:00 a
alguien que amanece produce "Buenas noches".

**Riesgo aceptado:** el LLM puede confundir a quién va dirigido con quién se
menciona ("dile a Ana que Pedro no viene"). Se acepta a cambio de que dictar sea
natural; la alternativa determinista (saludo genérico siempre) queda como plan B
si en uso real falla a menudo.

### Un solo perfil, forma de correo

El formalizador escribe **correos**: saludo en línea aparte, cuerpo, despedida y
firma. Para chat ya existe `default_es_casual` con su propio atajo. Dos perfiles,
dos atajos, cada uno hace una cosa bien.

**Descartado:** que el LLM deduzca el canal. Volvería no determinista justo lo
que se acaba de fijar — el mismo dictado saldría con firma o sin ella.

### `formalize_prompt_id` en vez de fijar el perfil a fuego

El binding lee un ajuste propio que apunta por defecto al perfil sembrado, sin
tocar la selección global. Cuesta unas 20 líneas más que fijarlo en el código y
permite apuntar la tecla a otro perfil desde un desplegable.

**Descartado:** el refactor de "cada binding lleva su perfil" (que eliminaría la
selección global). Es el diseño correcto a largo plazo, pero toca settings,
migración, UI y los dos caminos de atajo a cuatro días de la entrega.

## Comportamiento

Binding nuevo `transcribe_and_formalize`. Dictas → se transcribe → se aplica el
perfil apuntado por `formalize_prompt_id` → se inserta ya formalizado.

Se ignora cuando `post_process_enabled` es `false`, con log, igual que hace hoy
`transcribe_with_post_process` (`shortcut/mod.rs:397` y
`shortcut/handy_keys.rs:437`).

**El camino es idéntico al de `transcribe_with_post_process` salvo en qué prompt
se ejecuta.** Es decir: el dictado pasa por la misma corrección de
`custom_words` y `custom_replacements` antes del LLM, y por el mismo camino de
inserción (`paste`) después. Esta feature no introduce una ruta paralela.

### Atajo por defecto

Una sola tecla, con default por plataforma siguiendo el patrón que ya usa el
atajo de post-proceso en `settings.rs`:

> **⚠️ CORRECCIÓN (2026-07-29, durante la implementación).** El default final es
> **`f9` en todas las plataformas**, no lo que dice la tabla de abajo. La revisión
> final de la rama encontró dos problemas que este diseño no previó:
>
> 1. **Un modificador desnudo bloquea la _pulsación_**, no solo aparece en el
>    hotkey. Con `ctrl_right` registrado, pulsar Ctrl derecho para hacer Ctrl+C
>    arranca una grabación y la app enfocada recibe una `c` literal. En macOS
>    `cmd_right` es peor: Command es el modificador de casi todos los atajos del
>    sistema. (La regla "jamás bloquear _releases_" de §5 de `CLAUDE.md` sigue
>    respetada; esto es sobre las pulsaciones, que es otra cosa.)
> 2. **Bajo la implementación Tauri —la de por defecto en Linux— `ctrl_right`
>    pasaba la validación pero fallaba al parsear**, así que el atajo aparecía en
>    Ajustes y no respondía nunca, en silencio.
>
> `f9` es una sola tecla, no es modificador (no se traga nada) y ambos
> validadores de teclado lo aceptan. Charly ratificó el cambio. El razonamiento
> de la tabla siguiente se conserva porque explica por qué se descartaron AltGr
> y `shift_right`, que sigue vigente.

| Plataforma      | Default          | Por qué                                                                       |
| --------------- | ---------------- | ----------------------------------------------------------------------------- |
| Windows / Linux | ~~`ctrl_right`~~ | Existe en todo teclado PC, no colisiona con AltGr, libre al escribir          |
| macOS           | ~~`cmd_right`~~  | Los MacBook no tienen Ctrl derecho; Command derecho sí, y suelto no hace nada |

**Nada de acordes de tres teclas, y nunca Ctrl+Alt.** En teclado español AltGr
envía literalmente Ctrl+Alt, así que un atajo con esa combinación se dispararía
al escribir `@`, `#`, `€` o `\`. No es una intuición: en la crate vendorizada,
`alt_right` está aliaseado a `"altgr"`
(`vendor/handy-keys/src/types/modifiers.rs:128`). Por lo mismo queda descartado
`shift_right`, que se pisa con cada mayúscula, y en macOS la tecla `fn`, que
macOS reserva para su propio dictado.

El validador (`validate_shortcut` en `shortcut/handy_keys.rs:413`) acepta
modificador suelto, tecla suelta y combinación, así que una sola tecla es un
default legítimo, no un apaño. Es lo que ya usa Charly para dictar (`alt_left`).

> **⚠️ Hotkeys de solo-modificador.** Esta es exactamente la familia que provocó
> el secuestro de teclado documentado en `CLAUDE.md` §5: el hook de bajo nivel de
> Windows se tragaba los releases de modificadores cuyo estado resultante
> coincidía con un hotkey de solo-modificador, dejando Shift/Alt/Win clavados a
> nivel de sistema operativo. **La regla que salió de ahí es: jamás bloquear
> releases.** El bug está arreglado y con tests de regresión en la crate
> vendorizada y en `shortcut/handy_keys.rs`, así que no es un riesgo abierto —
> pero queda escrito aquí para que nadie lo reintroduzca al tocar esta zona, y
> como recordatorio de que la 0.3.0 de crates.io tiene el mismo bug.

Al ser modificador desnudo, el binding hereda el push-to-talk y el doble-tap del
coordinador sin código adicional.

## Ajustes nuevos

| Ajuste                | Tipo                 | Default              |
| --------------------- | -------------------- | -------------------- |
| `user_full_name`      | `String`             | `""`                 |
| `formality_treatment` | enum `Tu` \| `Usted` | `Tu`                 |
| `formalize_prompt_id` | `Option<String>`     | `"default_es_email"` |

Más un `LLMPrompt` sembrado con id `default_es_email`, en la línea de los tres
perfiles ES que ya existen.

### Migración de esquema v6 → v7

`CURRENT_SETTINGS_SCHEMA_VERSION` pasa de 6 a 7. La migración:

- Añade el perfil `default_es_email` a los stores existentes, igual que la v2
  hizo con los perfiles ES.
- **No pisa** un prompt que ya tenga ese id (un usuario pudo editarlo).
- **No toca** `post_process_selected_prompt_id`: la selección global del usuario
  se conserva intacta.
- Siembra los defaults de los tres ajustes nuevos.

Serde nunca toca un campo que ya está en el store, así que cambiar solo el
default no bastaría para los usuarios existentes — de ahí la migración.

## Funciones puras

### `greeting_for_hour(hour: u32) -> &'static str`

| Rango (hora local) | Saludo        |
| ------------------ | ------------- |
| 5–11               | Buenos días   |
| 12–19              | Buenas tardes |
| 20–4               | Buenas noches |

Recibe la hora como parámetro (no la lee del reloj) para que sea testeable sin
mockear el tiempo. El llamador le pasa la hora local del sistema.

### `render_prompt_variables(template: &str, vars: &PromptVars) -> String`

Sustituye `${saludo}`, `${nombre_usuario}` y `${tratamiento}` antes de enviar el
prompt, al lado del `replace("${output}", ...)` que ya existe en
`actions.rs:278`. La sustitución de prompts hoy es una operación de texto simple,
así que esto encaja sin tocar la arquitectura.

Valores inyectados: `${tratamiento}` es literalmente `"tú"` o `"usted"`;
`${saludo}` es la salida de `greeting_for_hour`; `${nombre_usuario}` es
`user_full_name` tal cual.

**Los dos modos del post-procesado.** `actions.rs` tiene un camino con salida
estructurada (que **elimina** `${output}` del prompt de sistema y manda la
transcripción como mensaje de usuario, `actions.rs:65`) y uno legacy (que
sustituye `${output}` en línea, `actions.rs:278`). Las tres variables nuevas se
sustituyen en **ambos**, y siempre **antes** de que se toque `${output}`, para
que el prompt de sistema llegue completo en los dos casos.

**Caso borde:** con `user_full_name` vacío, la firma sale sin nombre en vez de un
"Saludos," colgando.

## Manejo de errores

Sin cambios de política respecto a lo que ya hay: si no hay proveedor
configurado o falla la llamada, `post_process_transcription` devuelve `None` y
**se inserta el texto crudo**. Un fallo del LLM nunca puede costar un dictado.

## UI e i18n

Tres controles en Ajustes → Post-procesamiento: nombre completo, tratamiento
(tú/usted) y el desplegable de perfil a formalizar, más el control del atajo
nuevo junto a los otros.

Los atajos **no aparecen solos** en la UI: cada uno se pinta con un componente
explícito, como en `PostProcessingSettings.tsx:434`
(`shortcutId="transcribe_with_post_process"`). El nuevo lleva el suyo al lado.

Claves nuevas en las **21 locales**, con `bun run check:translations` en verde.

## Tests (TDD, rojo primero)

- `greeting_for_hour` en los límites: 4, 5, 11, 12, 19, 20, 0.
- `render_prompt_variables` con nombre y sin nombre, y que las variables se
  sustituyan tanto en el camino estructurado como en el legacy.
- Migración v7: siembra el perfil; no pisa uno existente con el mismo id;
  conserva `post_process_selected_prompt_id`.
- El binding se ignora con `post_process_enabled = false`.
- Test de comportamiento del perfil contra la API real, como los tres perfiles ES
  que ya existen.

> **Aviso sobre el último:** los tests de perfiles ES llaman a la API real de
> OpenAI y fallan esporádicamente por red o por no determinismo del LLM. Ha
> pasado varias veces y siempre pasaron al reintentar. **Reintentar antes de
> sospechar una regresión.**

## Fuera de alcance (YAGNI)

Firma con cargo o empresa · varias plantillas de correo · detección automática
de canal · traducción al inglés · destinatario desde una libreta de contactos ·
el refactor de "cada binding lleva su perfil".

## Dependencias

Ninguna nueva. Todo se apoya en `post_process_transcription`, el sistema de
atajos, el store de settings y su mecanismo de migración.
