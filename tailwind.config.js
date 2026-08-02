/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <<< ovo je ključno
  content: ["./src/**/*.{html,js,ts}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1B1E22',
          soft: '#24282E',
          line: '#323840',
        },
        steel: {
          DEFAULT: '#E7E9E7',
          soft: '#F1F2F0',
        },
        rust: {
          light: '#E3A791',
          DEFAULT: '#BE5B39',
          dark: '#9C4A2E',
        },
        blade: {
          light: '#9DC1D6',
          DEFAULT: '#3E6E8E',
          dark: '#2C5170',
        },
        resin: {
          light: '#A9CBBE',
          DEFAULT: '#4F7A6B',
          dark: '#395C50',
        },
        kraft: {
          DEFAULT: '#C9BFA8',
          soft: '#DAD2BD',
        },
      },
      fontFamily: {
        display: ['"Big Shoulders"', 'sans-serif'],
        stencil: ['"Big Shoulders Stencil"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        tag: '0 1px 0 rgba(27,30,34,0.04), 0 2px 6px rgba(27,30,34,0.06)',
        'tag-dark': '0 1px 0 rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.35)',
      },
      opacity: {
        8: '0.08',
        12: '0.12',
        15: '0.15',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
    },
  },
  plugins: [],
}
