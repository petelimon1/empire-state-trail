import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Trail palette — rust and forest rather than the violet/emerald
        // combo, so accent colors read as a deliberate choice for this trip
        // rather than a generic template default.
        highland: {
          rust: '#B5502E',
          'rust-dark': '#8A3B21',
          green: '#3F6B4A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'serif'],
        body: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'highland-gradient': 'linear-gradient(160deg, #14100d 0%, #241a12 45%, #14201a 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glass': '0 4px 32px 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
