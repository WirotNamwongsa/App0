export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        scout: {
          50: '#f0faf5',
          100: '#d6f0e3',
          200: '#aee0c8',
          300: '#77c9a5',
          400: '#3dac7e',
          500: '#1e8f62',
          600: '#13724e',
          700: '#0f5b3f',
          800: '#0d4832',
          900: '#0a3a28',
          950: '#051e15',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        thai: ['"Sarabun"', 'sans-serif'],
        display: ['"Kanit"', 'sans-serif'],
      }
    }
  },
  plugins: []
}