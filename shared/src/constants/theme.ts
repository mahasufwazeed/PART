/**
 * PART Brand Design System & Color Tokens
 * Consumer-first Quick-Commerce Hyperlocal Task Marketplace (Blinkit-inspired)
 */

export const colors = {
  // Signature PART Yellow
  brandYellow: '#FFCC00',
  brandYellowHover: '#E6B800',
  brandYellowLight: '#FFFBEB',
  brandYellowSubtle: '#FEF9C3',

  // Consumer Action Greens
  darkGreen: '#146B3A',
  darkGreenHover: '#0F532D',
  forestGreen: '#155E35',
  mintGreen: '#E8F5E9',
  mintGreenSubtle: '#F0FDF4',

  // Neutrals & Surface
  white: '#FFFFFF',
  background: '#F7F8FA',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Typography
  blackText: '#171717',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',

  // Status & Feedback
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',

  // Backward compatibility alias keys
  primary: '#146B3A',
  primaryLight: '#16A34A',
  primaryDark: '#0F532D',
  secondary: '#FFCC00',
  secondaryLight: '#FEF08A',
  secondaryDark: '#CA8A04',
  accent: '#FFCC00',
  accentLight: '#FEF9C3',
  accentDark: '#E6B800',

  light: {
    background: '#F7F8FA',
    card: '#FFFFFF',
    text: '#171717',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceSubtle: '#F3F4F6',
  },

  dark: {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#334155',
    borderLight: '#475569',
    surface: '#1E293B',
    surfaceSubtle: '#334155',
  },
};

export const typography = {
  fontFamilies: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Poppins, system-ui, -apple-system, sans-serif',
  },
  fontSize: {
    hero: 28,
    section: 19,
    cardTitle: 15,
    body: 14,
    caption: 11,
    xs: 11,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
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
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};
