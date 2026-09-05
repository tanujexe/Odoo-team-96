/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf4f2',
          100: '#fbe6e2',
          500: '#e0533c',
          600: '#cd442e',
          700: '#aa3320',
        },
        cream: {
          50: '#fcfbfa',
          100: '#f8f6f1',
          200: '#efece5',
          300: '#e5e1d7',
          400: '#d5d0c3',
          900: '#1a1d20',
        },
        canvas: '#f4f1ea',
        charcoal: '#1a1d20',
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
}

