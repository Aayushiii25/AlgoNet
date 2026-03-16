/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#edfffe',
          100: '#c0fffc',
          200: '#81fef9',
          300: '#3afbf5',
          400: '#0ce8e3',
          500: '#00cbc9',
          600: '#00a2a5',
          700: '#008085',
          800: '#06656b',
          900: '#0a5359',
          950: '#003337',
        },
        neon: {
          green: '#39FF14',
          blue: '#00F0FF',
          purple: '#BF40BF',
          pink: '#FF10F0',
          orange: '#FF6700',
        },
        dark: {
          900: '#0a0e17',
          800: '#0f1520',
          700: '#151d2e',
          600: '#1a2438',
          500: '#243044',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'packet-pulse': 'packet-pulse 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'packet-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.7' },
        },
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.1)',
        'neon-lg': '0 0 20px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
