// Personify Ads logo mark — a blue→violet spark in a dark rounded square,
// matching the app's brand (blue primary, violet accent). Optionally renders
// the "Personify Ads" wordmark beside it.

export function BrandMark({
  size = 26,
  withWordmark = false,
  className = '',
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="1" y="1" width="30" height="30" rx="8.5" fill="#0b0d12" />
        <path
          d="M16 6.5 L19.2 12.8 L26 16 L19.2 19.2 L16 25.5 L12.8 19.2 L6 16 L12.8 12.8 Z"
          fill="url(#pa-spark)"
        />
        <defs>
          <linearGradient id="pa-spark" x1="6" y1="6.5" x2="26" y2="25.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <span className="font-serif text-[15px] font-semibold tracking-tight text-ink">
          Personify Ads
        </span>
      )}
    </span>
  );
}
