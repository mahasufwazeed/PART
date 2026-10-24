/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFCC00',
          'yellow-hover': '#E6B800',
          'yellow-light': '#FFFBEB',
          'yellow-subtle': '#FEF9C3',
          dark: '#171717',
        },
        part: {
          green: '#146B3A',
          'green-dark': '#0F532D',
          'green-forest': '#155E35',
          'green-mint': '#E8F5E9',
          'green-light': '#D1FAE5',
        },
        primary: {
          DEFAULT: '#146B3A', // Primary CTA: Dark Green
          light: '#16A34A',
          dark: '#0F532D',
        },
        secondary: {
          DEFAULT: '#FFCC00', // Signature PART Yellow
          light: '#FEF08A',
          dark: '#CA8A04',
        },
        accent: {
          DEFAULT: '#FFCC00', // Signature PART Yellow
          light: '#FEF9C3',
          dark: '#E6B800',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          card: '#FFFFFF',
          dark: '#0F172A',
          darkCard: '#1E293B',
        },
        neutralText: {
          primary: '#171717',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'quick': '0 2px 8px -2px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 14px -3px rgba(0, 0, 0, 0.07)',
        'sticky': '0 -4px 16px -2px rgba(0, 0, 0, 0.08)',
        'yellow': '0 4px 14px -2px rgba(255, 204, 0, 0.45)',
        'green': '0 4px 14px -2px rgba(20, 107, 58, 0.35)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
