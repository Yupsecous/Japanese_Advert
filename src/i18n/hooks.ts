import { useAppStore } from '../store';
import { translate, type Locale } from './index';

export function useLocale(): Locale {
  return useAppStore((s) => s.locale);
}

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const locale = useLocale();
  return (key, vars) => translate(locale, key, vars);
}
