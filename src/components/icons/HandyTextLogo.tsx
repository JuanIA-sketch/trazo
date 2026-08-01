import isotipo from "../../assets/isotipo-trazo.png";

// Marca del sidebar: el isotipo definitivo del ZIP de Claude Design junto al
// wordmark. El diseño los cruza por opacidad al colapsar el sidebar; mientras
// el colapso no exista, se muestran juntos como bloque de marca.
//
// Conserva nombre y props del componente original para seguir siendo drop-in.
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
    <div
      className={`trz-marca ${className ?? ""}`}
      style={{ width, height }}
      aria-label={BRAND_NAME}
    >
      <img src={isotipo} alt="" aria-hidden="true" className="trz-marca__iso" />
      <span className="trz-marca__wordmark">{BRAND_NAME}</span>
    </div>
  );
};

export default HandyTextLogo;
