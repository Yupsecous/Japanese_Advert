import logoFull from '../logo.png';
import logoSymbol from '../logo-symbol.svg';

export function BrandMark({
  size = 26,
  withWordmark = false,
  className = '',
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  if (withWordmark) {
    return (
      <img
        src={logoFull}
        alt="Personify Ads"
        height={size}
        className={`block w-auto shrink-0 ${className}`}
        style={{ height: size }}
      />
    );
  }

  // Symbol SVG is portrait (309×451). Derive height from aspect ratio so
  // the img never collapses to 0 when height:auto fails to resolve.
  const h = Math.round(size * (451 / 309));
  return (
    <img
      src={logoSymbol}
      alt="Personify Ads"
      width={size}
      height={h}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: h }}
    />
  );
}
