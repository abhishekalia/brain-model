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
        'text-primary': '#E0D7FF',
        'text-secondary': '#6B6B8A',
        accent: '#7C3AED',
        'accent-blue': '#3B82F6',
        'accent-dim': 'rgba(124,58,237,0.12)',
        'accent-glow': 'rgba(124,58,237,0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
