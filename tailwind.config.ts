import type { Config } from 'tailwindcss'

// Paleta "EQUIPO RUST": negros cálidos (slate) y dorados del logo (amber).
// Se sobreescriben las escalas completas para retematizar sin tocar los componentes.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#050403',
          900: '#0a0907',
          800: '#16120d',
          700: '#262014',
          600: '#3d331e',
          500: '#6b5c3c',
          400: '#a79470',
          300: '#d0c3a0',
          200: '#e7ddc4',
        },
        amber: {
          100: '#faf3da',
          300: '#f3d98a',
          400: '#e9c25a',
          500: '#d5a437',
          600: '#b8862a',
          700: '#8f671f',
          900: '#3d2c0f',
        },
        yellow: {
          400: '#e9c25a',
        },
      },
    },
  },
  plugins: [],
}
export default config
