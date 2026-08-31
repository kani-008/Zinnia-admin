/**
 * Fluid scale generator.
 *
 * Returns a clamp() that sits at `minPx` on a 360px viewport, grows linearly,
 * and locks at `maxPx` from 1280px up. Because these override the default
 * `fontSize` / `spacing` keys, every existing `text-xs` / `p-4` in the app
 * becomes viewport-fluid without touching the markup.
 */
const VP_MIN = 360;
const VP_MAX = 1280;

const r = (n) => `${Math.round(n * 10000) / 10000}`;

function fluid(minPx, maxPx) {
  const minRem = minPx / 16;
  const maxRem = maxPx / 16;
  const vwMin = VP_MIN / 16;
  const vwMax = VP_MAX / 16;
  const slope = (maxRem - minRem) / (vwMax - vwMin);
  const intercept = minRem - slope * vwMin;
  return `clamp(${r(minRem)}rem, ${r(intercept)}rem + ${r(slope * 100)}vw, ${r(maxRem)}rem)`;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Narrow phones (iPhone SE / Galaxy S-mini) get their own breakpoint so
        // two-up grids can collapse below 400px instead of at Tailwind's 640px.
        'xs': '400px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      fontSize: {
        '2xs':  [fluid(9.5, 11),  { lineHeight: '1.45' }],
        'xs':   [fluid(10.5, 12), { lineHeight: '1.5' }],
        'sm':   [fluid(12, 14),   { lineHeight: '1.5' }],
        'base': [fluid(14, 16),   { lineHeight: '1.55' }],
        'lg':   [fluid(15.5, 18), { lineHeight: '1.45' }],
        'xl':   [fluid(17, 22),   { lineHeight: '1.3' }],
        '2xl':  [fluid(20, 30),   { lineHeight: '1.2' }],
        '3xl':  [fluid(23, 40),   { lineHeight: '1.12' }],
        '4xl':  [fluid(27, 52),   { lineHeight: '1.08' }],
      },
      spacing: {
        'fluid-1': fluid(4, 6),
        'fluid-2': fluid(6, 10),
        'fluid-3': fluid(10, 14),
        'fluid-4': fluid(13, 20),
        'fluid-5': fluid(16, 26),
        'fluid-6': fluid(20, 34),
        'fluid-8': fluid(26, 48),
        'gutter': 'clamp(0.75rem, 3.2vw, 2rem)',
        'touch': '2.75rem',
      },
      borderRadius: {
        'fluid': fluid(8, 12),
        'fluid-lg': fluid(12, 18),
        'fluid-xl': fluid(14, 24),
      },
      minHeight: {
        'touch': '2.75rem',
        'screen-d': '100dvh',
      },
      minWidth: {
        'touch': '2.75rem',
      },
      maxWidth: {
        'screen-safe': '100vw',
      },
    },
  },
  plugins: [],
}
