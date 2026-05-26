// American-editorial visual pass — same palette as the web app.
// Cream canvas, navy primary, serif headings (loaded via expo-font if needed).

export const colors = {
  canvas: '#FAF6EE',
  paper: '#FFFFFF',
  ink: '#0A1834',
  inkSoft: '#465778',
  inkFaint: '#92A1BD',
  rule: '#E4DCC9',
  accent: '#B23A48',
  brand: '#0A1834',
  brandDark: '#050B1F',
  success: '#1F7A4E',
  warn: '#A26B2A',
  error: '#A8341F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const type = {
  serifDisplay: { fontFamily: 'serif', fontWeight: '500' as const },
  body: { fontFamily: 'System', fontSize: 16, color: colors.ink },
  bodySmall: { fontFamily: 'System', fontSize: 13, color: colors.inkSoft },
  eyebrow: {
    fontFamily: 'System',
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
} as const;
