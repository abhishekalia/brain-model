/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F4',
        'cream-dark': '#F0EDE8',
        border: '#E8E3DC',
        'text-primary': '#1C1C1C',
        'text-secondary': '#6B6560',
        accent: '#8B5E3C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
