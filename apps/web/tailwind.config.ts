import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A6B9E',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F5A623',
          foreground: '#0B1E2F',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        destructive: '#EF4444',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
