/**
 * PART Brand Design System & Color Tokens
 */

export const colors = {
  primary: '#4338CA', // Deep Indigo
  primaryLight: '#6366F1',
  primaryDark: '#312E81',
  secondary: '#2563EB', // Electric Blue
  secondaryLight: '#60A5FA',
  secondaryDark: '#1D4ED8',
  accent: '#10B981', // Emerald Green
  accentLight: '#34D399',
  accentDark: '#047857',

  // Status Colors
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Light Theme Neutrals
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
  },

  // Dark Theme Neutrals
  dark: {
    background: '#0B0F19',
    card: '#151D2F',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#1E293B',
    borderLight: '#334155',
    surface: '#151D2F',
    surfaceSubtle: '#1E293B',
  },
};

export const typography = {
  fontFamilies: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Outfit, Inter, sans-serif',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};
