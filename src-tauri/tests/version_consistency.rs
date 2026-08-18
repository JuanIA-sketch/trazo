//! La versión del crate y la del bundle tienen que ser la misma.
//!
//! No son la misma cosa por accidente: `tauri.conf.json` manda en el instalador
//! y en el updater, y `Cargo.toml` manda en todo lo que el código Rust imprime
//! por `CARGO_PKG_VERSION`. Cuando se separan no falla nada, que es justo el
//! problema: la 0.9.5 se publicó con `Cargo.toml` en 0.9.2, y la bandeja del
//! sistema estuvo diciendo "Trazo v0.9.2" en una build 0.9.5 (`tray.rs`).
//!
//! Subir la versión toca tres archivos (`tauri.conf.json`, `package.json` y
//! `Cargo.toml`) y olvidar el tercero es silencioso. Este test lo hace ruidoso.

/// Versión declarada en `tauri.conf.json`, leída en tiempo de compilación para
/// no depender del directorio desde el que se lance el test.
const TAURI_CONF: &str = include_str!("../tauri.conf.json");

fn tauri_conf_version() -> String {
    let value: serde_json::Value =
        serde_json::from_str(TAURI_CONF).expect("tauri.conf.json debe ser JSON válido");
    value["version"]
        .as_str()
        .expect("tauri.conf.json debe declarar `version`")
        .to_string()
}

#[test]
fn the_crate_version_matches_the_bundle_version() {
    let bundle = tauri_conf_version();
    let crate_version = env!("CARGO_PKG_VERSION");

    assert_eq!(
        crate_version, bundle,
        "Cargo.toml dice {crate_version} y tauri.conf.json dice {bundle}. \
         Lo que la app enseña por CARGO_PKG_VERSION (la bandeja, entre otros) \
         no coincidiría con la versión que se distribuye. Sube los tres: \
         tauri.conf.json, package.json y Cargo.toml."
    );
}
