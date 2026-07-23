// Placeholder del ícono (la mano de Handy) mientras no hay logo final: un
// monograma "T". Conserva `fill-text` como el original para seguir el color
// del texto de la UI en la navegación (un morado fijo desaparecería sobre el
// fondo morado del ítem activo del sidebar).
const BRAND_INITIAL = "T";

const HandyHand = ({
  width,
  height,
}: {
  width?: number | string;
  height?: number | string;
}) => (
  <svg
    width={width || 126}
    height={height || 135}
    viewBox="0 0 126 135"
    className="fill-text"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="63"
      y="74"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="120"
      fontWeight="700"
    >
      {BRAND_INITIAL}
    </text>
  </svg>
);

export default HandyHand;
