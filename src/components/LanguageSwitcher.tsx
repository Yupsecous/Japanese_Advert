import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT_LABELS, type Locale } from '../i18n';
import { useT } from '../i18n/hooks';

export function LanguageSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('app.language')}
        className="inline-flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          className="opacity-70"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 0c1.8 2 2.8 4.2 2.8 6.5 0 2.3-1 4.5-2.8 6.5M8 1.5C6.2 3.5 5.2 5.7 5.2 8c0 2.3 1 4.5 2.8 6.5M2 8h12"
          />
        </svg>
        <span className="font-medium tracking-wide">{LOCALE_SHORT_LABELS[locale]}</span>
        <span aria-hidden="true" className="text-xs opacity-70">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-rule bg-paper shadow-md"
        >
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(code)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-canvas-deep text-ink'
                      : 'text-ink-soft hover:bg-canvas-deep hover:text-ink'
                  }`}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  <span className="ml-3 text-xs uppercase tracking-wide opacity-60">
                    {LOCALE_SHORT_LABELS[code]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
