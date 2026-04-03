/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#0C0C0C',
        'surface-2': '#141414',
        border: '#1F1F1F',
        'text-primary': '#FFFFFF',
        'text-secondary': '#555555',
        accent: '#FF6500',
        'accent-dim': 'rgba(255,101,0,0.12)',
        'accent-glow': 'rgba(255,101,0,0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
