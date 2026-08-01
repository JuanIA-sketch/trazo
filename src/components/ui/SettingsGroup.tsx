import React from "react";

interface SettingsGroupProps {
  title?: string;
  description?: string;
  /** Ícono del chip de la cabecera. Sin él, la cabecera va sin chip. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Contador del diseño, a la derecha del título. Si no se pasa, se cuentan
   *  las filas reales: escribirlo a mano se desincroniza en cuanto una fila
   *  aparece o desaparece por condición. */
  count?: number;
  /** El panel destacado: borde en degradado. UNO por pantalla (regla del sistema). */
  featured?: boolean;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  description,
  icon: Icon,
  count,
  featured = false,
  children,
}) => {
  const filas = React.Children.toArray(children).filter(Boolean).length;
  const contador = count ?? filas;
  if (featured) {
    return (
      <div className="trz-panel--destacado">
        {title && (
          <div className="trz-panel__head" style={{ padding: 0 }}>
            {Icon && (
              <span className="trz-chip-grupo">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <span className="trz-panel__title">{title}</span>
            {contador > 0 && (
              <span className="trz-panel__count">{contador}</span>
            )}
          </div>
        )}
        {description && <div className="trz-panel__desc">{description}</div>}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="trz-panel">
      {title && (
        <>
          <div className="trz-panel__head">
            {Icon && (
              <span className="trz-chip-grupo">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <span className="trz-panel__title">{title}</span>
            {contador > 0 && (
              <span className="trz-panel__count">{contador}</span>
            )}
          </div>
          {description && <div className="trz-panel__desc">{description}</div>}
          <div className="trz-panel__sep" />
        </>
      )}
      <div>{children}</div>
    </div>
  );
};
