import type { ButtonHTMLAttributes, ReactNode } from 'react';

// The single canonical button for Personify Ads — Grok-style rounded pills.
//  - pill   : default. Light hairline pill (Manage / Change / Connect).
//  - solid  : primary blue action.
//  - dark   : near-black CTA (top-bar Upgrade, "Go Super" banner button).
//  - ghost  : borderless, for in-menu/row actions.
//  - danger : destructive (sign out / delete).
//  - light  : white pill on a dark surface (the banner's "Go Super").
export type ButtonVariant = 'pill' | 'solid' | 'dark' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
};

const VARIANTS: Record<ButtonVariant, string> = {
  pill: 'border border-rule bg-paper text-ink-soft hover:bg-canvas-deep hover:text-ink',
  solid: 'bg-brand text-white hover:bg-brand-dark',
  dark: 'bg-ink text-white hover:bg-ink/90',
  ghost: 'text-ink-soft hover:bg-canvas-deep hover:text-ink',
  danger: 'border border-rule bg-paper text-red-600 hover:bg-red-50',
  light: 'bg-white text-ink hover:bg-white/90',
};

// The exact class string for a given variant/size — so plain <button>s (e.g.
// deep in the step screens) can adopt the identical Grok style without being
// rewritten into the component. Single source of truth for the look.
export function buttonClass(variant: ButtonVariant = 'pill', size: ButtonSize = 'md'): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
}

export function Button({
  variant = 'pill',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}) {
  return (
    <button {...props} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </button>
  );
}
