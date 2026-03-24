/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b1c5ff',
        tertiary: '#cdbdff',
        secondary: '#a6e6ff',
        background: '#131313',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1b1c1c',
        'surface-container': '#1f2020',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353535',
        'on-surface': '#e4e2e1',
        'on-surface-variant': '#c3c6d6',
        'primary-container': '#0051c3',
        'secondary-container': '#14d1ff',
        'tertiary-container': '#622ae4',
        error: '#ffb4ab',
        outline: '#8d909f',
        'outline-variant': '#434653'
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      borderRadius: {
        sm: '0.125rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '999px'
      },
      boxShadow: {
        ambient: '0 0 40px rgba(177, 197, 255, 0.06)',
        glow: '0 0 40px rgba(177, 197, 255, 0.16)',
        card: '0 20px 60px rgba(0, 0, 0, 0.32)'
      },
      backdropBlur: {
        glass: '20px'
      }
    }
  },
  plugins: []
};
