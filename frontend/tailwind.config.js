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
        surface: {
          DEFAULT: 'var(--surface)',
          card: 'var(--surface-card)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        terracotta: {
          50: '#FAF3F0',
          100: '#F5E6E1',
          200: '#EBCDC4',
          300: '#DEACA0',
          400: '#D28573',
          500: '#C45A3C', // Primary Brand Accent
          600: '#B34F33',
          700: '#9E442B',
          800: '#803722',
          900: '#662C1B',
          dark: '#D06A4A',
        },
        olive: {
          50: '#F4F6F2',
          100: '#E8ECE4',
          200: '#D2DBCB',
          300: '#B6C4AC',
          400: '#8E9E81',
          500: '#68735B', // Secondary Accent
          600: '#58624D',
          700: '#495240',
          800: '#3A4133',
          dark: '#7E8A70',
        },
        paper: {
          50: '#FAF9F6',
          100: '#F7F5F0', // Primary Light Background
          200: '#EFECE4',
          300: '#E8E4DA',
          400: '#D5D0C5',
          border: '#E2DED5', // Warm Light Gray Border
        },
        ink: {
          950: '#000000',
          900: '#000000', // Solid True Black
          850: '#000000',
          800: '#000000',
          700: '#000000',
          600: '#000000',
          500: '#000000',
          400: '#000000',
          300: '#000000',
          200: '#000000',
          100: '#000000',
          50: '#000000',
          DEFAULT: '#000000',
        },
        charcoal: {
          950: '#191918', // Dark Mode Background
          900: '#202124',
          850: '#242422', // Dark Mode Surface/Card
          800: '#2A2A28',
          700: '#343432',
          border: '#393833', // Dark Mode Border
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 20px -4px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'editorial': '10px',
        'card': '10px',
      }
    },
  },
  plugins: [],
}
