# Diccionario de reemplazos ampliado — diseño

**Estado:** propuesta, pendiente de aprobación de Charly.
**Fecha:** 2026-07-30.

> **Aviso:** la primera versión de este spec proponía sembrar una lista de
> nombres IA en el motor **difuso** (`custom_words`). Se midió antes de
> proponerlo en firme y **resultó destructivo** (§3). El diseño que sigue es el
> que sobrevivió a esa medición.

## Objetivo

Que los nombres del mundo IA salgan bien escritos **sin depender del LLM**, y
que corregir una palabra mal transcrita sea un gesto de dos clics desde el
Historial en vez de una excursión a Ajustes.

## 1. Lo que YA existe (y por tanto NO se construye)

| Pieza                                   | Estado                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Motor de reemplazos exactos             | `apply_custom_replacements` (`audio_toolkit/text.rs:113`)                          |
| Motor de corrección difusa              | `apply_custom_words` + `word_correction_threshold` (0.18)                          |
| **Alta manual en Ajustes**              | **YA EXISTE**: `CustomReplacements.tsx` (alta/baja/CSV) y `CustomWords.tsx`        |
| Glosario técnico en los prompts del LLM | Ya en los tres perfiles ES (`commit`, `pull request`, `n8n`…), solo con post-proceso |

De las tres piezas pedidas, **la del botón manual ya estaba hecha**. Queda la
lista precargada y la corrección desde el Historial.

## 2. Por qué esto no lo cubre el glosario del LLM

El glosario **solo actúa con el post-procesado encendido**: cuesta una llamada
de red y su latencia. El diccionario es la capa **determinista y offline** —
actúa en el dictado crudo, no gasta tokens y no puede alucinar. Complementarios.

## 3. La medición que cambió el diseño

Se probó la lista de nombres candidatos contra el motor difuso con el umbral
real (0.18), usando el código de producción:

| Frase dictada                | Resultado          |
| ---------------------------- | ------------------ |
| "se lo mando a **Claudia**"  | → "a **Claude**" ❌ |
| "hablé con **Claudio**"      | → "con **Claude**" ❌ |
| "no lo **veo** claro"        | → "no lo **Veo** claro" ❌ |
| "el **flujo** de trabajo"    | → "el **Flux** de trabajo" ❌ |
| "mi hermana **Sara**"        | → "mi hermana **Sora**" ❌ |

**Cinco de doce frases corrompidas.** La causa está en `find_best_match`: cuando
Soundex empareja, el score se multiplica por **0.3**, así que pares que la
distancia sola rechazaría (`claudia`/`claude` = 0.286) pasan holgadamente
(0.086 < 0.18).

**Conclusión: la lista precargada NO puede ir al motor difuso.** No es cuestión
de elegir mejor los términos: los que queremos (Claude, Sora, Flux, Veo) son
precisamente los que colisionan.

### Consecuencia inmediata, ya en producción

Los ajustes actuales de Charly tienen `custom_words: ["Claude"]`. **Hoy, dictar
"Claudia" o "Claudio" produce "Claude".** Es un bug activo, independiente de
esta feature, y conviene decidir qué hacer con él (§8).

## 4. El diseño que sí funciona: reglas exactas guiadas por datos

### 4.1 Nada de adivinar deformaciones

Una regla exacta necesita conocer la deformación (`cloud → Claude`). Inventarlas
es peligroso porque muchas son palabras reales. Pero **no hace falta
inventarlas: están en el historial del usuario**.

En los 20 dictados de Charly, `cloud` aparece **2 veces**, y en ambas quiso
decir Claude:

> "…él también tiene **cloud** Y puede ir a leerlo con **cloud**…"

(También aparece "la **Landi**" por "la landing".)

### 4.2 Rules propuestas desde el propio historial

Al abrir el Historial, Trazo puede **proponer** reglas a partir de lo que ya
dictó el usuario, en vez de traer una lista genérica. Cada propuesta llega con
su evidencia: cuántas veces aparece y en qué frases.

### 4.3 La red de seguridad: previsualizar el radio de impacto

Antes de guardar cualquier regla —propuesta o escrita a mano— se muestra **a
cuántos dictados del historial habría afectado, y se enseñan**. Es barato (los
dictados están en `history.db`) y convierte una decisión a ciegas en una
informada.

Para Charly, `cloud → Claude` arreglaría 2 y rompería 0: se guarda con
confianza. Si alguien usa "cloud" para hablar de la nube, verá que rompería 6
casos y no la guardará. **La misma regla, distinta decisión, según los datos de
cada uno.**

### 4.4 Lista precargada: mínima y solo lo inequívoco

Se siembra únicamente lo que **no puede colisionar** con español: deformaciones
multi-palabra o cadenas que no son palabras.

- `chat gpt` → `ChatGPT`
- `mid journey` → `Midjourney`
- `ene ocho ene` → `n8n`
- `pul reques` → `pull request`

Se **excluye** todo término de una sola palabra que exista en español o sea un
nombre de persona frecuente. Nada de `veo`, `flujo`, `sara`, `cloud` en la
siembra genérica: `cloud` solo entra si **los datos del usuario** lo respaldan
(§4.2).

Siembra con **migración de esquema v9**, criterio de la v7: añade lo que falta,
no pisa lo editado y **no resucita lo borrado**, porque corre una sola vez.

## 5. Corrección rápida desde el Historial

**Gesto:** botón "Corregir palabra" en cada fila. Se selecciona la palabra mal
transcrita, se escribe la correcta, se confirma. Genera una **regla exacta**,
que aquí es lo correcto: la deformación es un dato observado, no una suposición.

**Lo que NO hace:** no reescribe el dictado guardado. El Historial es un
registro de lo que pasó; reescribirlo destruiría la evidencia que hoy permite
diagnosticar los truncados. La regla actúa sobre los dictados **futuros**.

## 6. Ajustes nuevos

**Ninguno.** Se reutilizan `custom_replacements` (ya existente y persistido) y
`history.db`. La migración v9 solo siembra contenido.

## 7. Funciones puras (testeables sin UI ni red)

### `rule_impact(rule, transcripts) -> Vec<usize>`

Índices de los dictados que la regla cambiaría. Alimenta la previsualización.

### `propose_rules(transcripts, known_terms) -> Vec<Proposal>`

Deformaciones candidatas presentes en el historial, con su frecuencia y
ejemplos. Nunca propone una regla que el usuario ya tenga o haya rechazado.

### `seed_rules(existing) -> Vec<Rule>`

Qué reglas inequívocas añadir dadas las que ya hay. Idempotente.

## 8. Decisión abierta para Charly

**Qué hacer con `custom_words: ["Claude"]`**, que hoy corrompe Claudia/Claudio:

- **(a)** Quitarlo de sus ajustes y confiar en la regla exacta `cloud → Claude`.
  Recomendada: resuelve el caso real medido y elimina el daño.
- **(b)** Dejarlo y asumir el riesgo.
- **(c)** Tocar el umbral o el multiplicador de Soundex — afecta a todo el mundo
  y a todos los términos; no lo recomiendo para esta feature.

## 9. Tests (TDD, rojo primero)

1. `rule_impact` cuenta solo coincidencias de palabra completa.
2. `rule_impact` sobre el caso real: `cloud → Claude` marca 2 dictados.
3. `propose_rules` no propone lo que el usuario ya tiene.
4. `propose_rules` no repropone lo rechazado.
5. `seed_rules` es idempotente.
6. La migración v9 no resucita una regla borrada.
7. Una regla creada desde el Historial se aplica al siguiente dictado.
8. El dictado guardado **no** cambia al crear la regla.
9. Regresión del riesgo difuso: documenta que `Claude` en `custom_words`
   captura `Claudia` — para que nadie vuelva a sembrar nombres ahí sin medirlo.

## 10. UI e i18n

- Botón "Corregir palabra" por fila del Historial + diálogo con previsualización
  de impacto.
- Sección de propuestas en el Historial (descartable).
- Claves nuevas en **las 21 locales** (es es la referencia; `check:translations`
  valida las otras 20).

## 11. Fuera de alcance (YAGNI)

- Sincronizar el diccionario entre máquinas.
- Reescribir dictados pasados.
- Importar/exportar la lista (el CSV ya existente lo cubre).
- Cambiar el motor difuso o su umbral.

## 12. Riesgos

1. **Las propuestas dependen de tener historial.** Un usuario nuevo no recibe
   nada útil hasta que acumula dictados. Aceptado: la siembra mínima del §4.4
   cubre el arranque.
2. **La lista precargada envejece.** Los nombres de moda cambian; es una siembra
   inicial, no un catálogo mantenido.
3. **Duplicidad con el glosario del LLM.** Si ambos corrigen lo mismo gana el
   diccionario (corre antes). Conviene no duplicar entradas para no mantener dos
   sitios.
