/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'canvas-dark':         '#0b0e11',
        'surface-card':        '#1e2329',
        'surface-elevated':    '#2b3139',
        'hairline-dark':       '#2b3139',
        'brand-yellow':        '#fcd535',
        'brand-yellow-active': '#f0b90b',
        'brand-yellow-dim':    '#3a3a1f',
        'on-primary':          '#181a20',
        'text-body':           '#eaecef',
        'text-muted':          '#707a8a',
        'trading-up':          '#0ecb81',
        'trading-down':        '#f6465d',
        'info':                '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
}
