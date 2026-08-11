import { TRAZO_GLYPH_PATH, TRAZO_GLYPH_VIEWBOX } from "./trazoGlyph";

// Trazo brand mark: the cursive "t" of the logo. Keeps `fill-text` like the
// original so it follows the UI text colour in the navigation — a fixed brand
// blue would disappear against the sidebar's active-item background.
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
    viewBox={TRAZO_GLYPH_VIEWBOX}
    className="fill-text"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={TRAZO_GLYPH_PATH} fillRule="evenodd" />
  </svg>
);

export default HandyHand;
