/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#121826',
          800: '#1F2937',
          300: '#D1D5DB',
          100: '#F3F4F6'
        },
        blue: {
          400: '#60A5FA',
          600: '#2563EB'
        },
        indigo: {
          500: '#6366F1',
          600: '#4F46E5'
        }
      }
    }
  },
  plugins: []
};
