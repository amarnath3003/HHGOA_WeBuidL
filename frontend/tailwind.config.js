/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed-dim": "#4cd6ff",
        "primary": "#b1c5ff",
        "on-tertiary": "#370096",
        "inverse-surface": "#e4e2e1",
        "on-error": "#690005",
        "on-secondary-fixed": "#001f28",
        "on-primary-fixed-variant": "#00419f",
        "outline-variant": "#434653",
        "on-surface": "#e4e2e1",
        "surface-tint": "#b1c5ff",
        "surface-container-high": "#2a2a2a",
        "surface-container-lowest": "#0e0e0e",
        "on-primary-container": "#beceff",
        "on-primary": "#002c71",
        "on-secondary-fixed-variant": "#004e60",
        "secondary": "#a6e6ff",
        "error-container": "#93000a",
        "on-tertiary-fixed-variant": "#4f00d0",
        "surface-container": "#1f2020",
        "surface": "#131313",
        "surface-container-low": "#1b1c1c",
        "surface-dim": "#131313",
        "primary-fixed": "#dae2ff",
        "on-primary-fixed": "#001947",
        "inverse-primary": "#1357c9",
        "primary-container": "#0051c3",
        "on-surface-variant": "#c3c6d6",
        "on-secondary": "#003543",
        "inverse-on-surface": "#303030",
        "surface-bright": "#393939",
        "tertiary-container": "#622ae4",
        "error": "#ffb4ab",
        "on-tertiary-container": "#d5c8ff",
        "tertiary-fixed": "#e8deff",
        "on-tertiary-fixed": "#20005f",
        "background": "#131313",
        "secondary-container": "#14d1ff",
        "primary-fixed-dim": "#b1c5ff",
        "tertiary-fixed-dim": "#cdbdff",
        "tertiary": "#cdbdff",
        "on-error-container": "#ffdad6",
        "surface-variant": "#353535",
        "outline": "#8d909f",
        "surface-container-highest": "#353535",
        "on-secondary-container": "#00566b",
        "secondary-fixed": "#b7eaff",
        "on-background": "#e4e2e1"
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
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    }
  },
  plugins: []
};
