import React from "react";

// Placeholder del wordmark mientras no hay logo final: el nombre "Trazo" en
// el morado de marca (--color-logo-primary: #7B2FBE claro / #A855F7 oscuro).
// Mantiene nombre, props y viewBox del logo original para ser drop-in; el
// logo definitivo reemplazará solo el contenido del SVG.
const BRAND_NAME = "Trazo";

const HandyTextLogo = ({
  width,
  height,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 930 328"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="465"
        y="178"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="240"
        fontWeight="700"
        letterSpacing="4"
        fill="var(--color-logo-primary)"
      >
        {BRAND_NAME}
      </text>
    </svg>
  );
};

export default HandyTextLogo;
