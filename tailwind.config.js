/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rozha One', 'serif'],
        decorative: ['Cinzel Decorative', 'cursive'],
        folk: ['Yatra One', 'cursive'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse-slow': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'flame-flicker': {
          '0%, 100%': {
            transform: 'scale(1) translate(0, 0)',
            opacity: '0.95',
            filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))',
          },
          '25%': {
            transform: 'scale(1.08, 0.94) translate(-1px, -1px)',
            opacity: '1',
            filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 1)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))',
          },
          '50%': {
            transform: 'scale(0.96, 1.05) translate(1px, -2px)',
            opacity: '0.9',
            filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 14px rgba(239, 68, 68, 0.5))',
          },
          '75%': {
            transform: 'scale(1.04, 0.98) translate(-0.5px, 0.5px)',
            opacity: '0.98',
            filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 18px rgba(239, 68, 68, 0.7))',
          },
        },
        'gentle-sway': {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        'toran-breeze': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-2px) rotate(0.4deg)' },
          '66%': { transform: 'translateY(1.5px) rotate(-0.3deg)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 40s linear infinite',
        'spin-reverse-slow': 'spin-reverse-slow 30s linear infinite',
        'flame': 'flame-flicker 1.8s ease-in-out infinite',
        'gentle-sway': 'gentle-sway 4s ease-in-out infinite',
        'toran-breeze': 'toran-breeze 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
