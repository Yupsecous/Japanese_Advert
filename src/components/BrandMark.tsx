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

  // Symbol SVG is portrait (309×451). Fix width; let height scale naturally.
  return (
    <img
      src={logoSymbol}
      alt="Personify Ads"
      width={size}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: 'auto' }}
    />
  );
}
