import React from "react";
import { TRAZO_GLYPH_PATH } from "./trazoGlyph";

// Trazo lockup: the cursive "t" mark followed by the wordmark. Keeps the
// original name, props and viewBox so it stays drop-in wherever the old logo
// was used. Both halves take --color-logo-primary, so they flip with the
// light/dark theme like the rest of the brand.
const BRAND_NAME = "Trazo";

// The glyph is authored on a 1000x1000 grid; 0.30 fits it inside the 328-tall
// viewBox with breathing room, and the wordmark starts clear of its widest point.
const GLYPH_SCALE = 0.3;

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
      <g transform={`translate(8 14) scale(${GLYPH_SCALE})`}>
        <path
          d={TRAZO_GLYPH_PATH}
          fillRule="evenodd"
          fill="var(--color-logo-primary)"
        />
      </g>
      <text
        x="340"
        y="178"
        dominantBaseline="middle"
        fontSize="215"
        fontWeight="700"
        letterSpacing="2"
        fill="var(--color-logo-primary)"
      >
        {BRAND_NAME}
      </text>
    </svg>
  );
};

export default HandyTextLogo;
