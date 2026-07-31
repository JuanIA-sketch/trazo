import { describe, expect, it } from "bun:test";
import {
  HISTORY_LIMIT_DEFAULT,
  RECORDING_RETENTION_DEFAULT,
  VAD_ENABLED_DEFAULT,
} from "./settingFallbacks";

// Auditoría del 2026-07-30: el patrón `getSetting(x) || fallback` estaba
// repetido en ~20 componentes y en tres de ellos el fallback NO coincidía con
// el default del backend. Ya había causado una pérdida silenciosa de dictados
// con `clipboard_handling` (ver [clipboardHandlingDefault]).
//
// Mientras los ajustes no han cargado, un fallback equivocado hace que la
// interfaz muestre algo distinto de lo que hay en disco. Eso no es cosmético:
// el usuario decide mirando lo que ve.
describe("fallbacks alineados con settings.rs", () => {
  // La migración v6 apagó el VAD porque en algunos equipos se comía casi el
  // dictado entero. La interfaz seguía proponiéndolo encendido, así que lo
  // mostraba activo cuando estaba apagado.
  it("vad_enabled arranca apagado, como el backend", () => {
    expect(VAD_ENABLED_DEFAULT).toBe(false);
  });

  // El default subió de 5 a 20 (§2.5) porque con 5 se borraban grabaciones
  // antes de poder revisarlas. La interfaz seguía proponiendo 5, y elegir ese
  // valor BORRA grabaciones.
  it("history_limit arranca en 20, como el backend", () => {
    expect(HISTORY_LIMIT_DEFAULT).toBe(20);
  });

  // "never" y "preserve_limit" no son lo mismo: el fallback prometía no borrar
  // nunca cuando el comportamiento real es borrar por encima del límite.
  it("recording_retention_period arranca en preserve_limit", () => {
    expect(RECORDING_RETENTION_DEFAULT).toBe("preserve_limit");
  });
});
