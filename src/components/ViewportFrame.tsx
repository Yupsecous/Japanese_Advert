import { useMemo, useState } from 'react';
import { useT } from '../i18n/hooks';

type Viewport = 'mobile' | 'tablet' | 'desktop';

// Visible iframe width per viewport, in CSS pixels. Tablet is iPad-portrait;
// mobile is a generic 390px (between iPhone SE and iPhone 14). Desktop fills
// the parent container.
const WIDTHS: Record<Viewport, number | null> = {
  mobile: 390,
  tablet: 768,
  desktop: null,
};

const HEIGHTS: Record<Viewport, number> = {
  mobile: 720,
  tablet: 820,
  desktop: 720,
};

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const ICONS: Record<Viewport, () => JSX.Element> = {
  mobile: PhoneIcon,
  tablet: TabletIcon,
  desktop: DesktopIcon,
};

type Props = {
  srcDoc: string;
  // Stable key so the iframe doesn't tear down when the viewport changes.
  // Used as the iframe's React key combined with the viewport selection.
  frameKey?: string;
  // Allow callers to override the default viewport. Mobile is a good default
  // when verifying generated landing pages, but FinalPackage may want desktop.
  defaultViewport?: Viewport;
  title?: string;
};

export function ViewportFrame({ srcDoc, frameKey, defaultViewport = 'desktop', title }: Props) {
  const t = useT();
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);

  const width = WIDTHS[viewport];
  const height = HEIGHTS[viewport];

  const label = useMemo(() => t(`viewport.${viewport}`), [t, viewport]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2">
        <div className="inline-flex rounded-md border border-neutral-200 bg-white p-0.5">
          {(['mobile', 'tablet', 'desktop'] as const).map((v) => {
            const Icon = ICONS[v];
            const active = v === viewport;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon />
                <span>{t(`viewport.${v}`)}</span>
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[11px] text-neutral-500">
          {width ? `${width}px` : `100%`} × {height}px
        </span>
      </div>

      <div className="flex justify-center overflow-auto bg-[repeating-conic-gradient(theme(colors.neutral.100)_0_25%,_transparent_0_50%)] bg-[length:16px_16px] p-3 md:p-6">
        <div
          className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm"
          style={width ? { width: `${width}px`, maxWidth: '100%' } : { width: '100%' }}
        >
          <iframe
            key={`${frameKey ?? 'frame'}-${viewport}`}
            title={title ?? label}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            style={{ width: '100%', height: `${height}px`, display: 'block', border: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
