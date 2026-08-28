/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,ts}',
    './packages/**/*.{astro,html,js,ts}',
    './templates/**/*.{astro,html,js,ts}',
    './landings/**/*.{astro,html,md,json}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--c-ink)',
        graphite: {
          DEFAULT: 'var(--c-graphite)',
          2: 'var(--c-graphite-2)',
          3: 'var(--c-graphite-3)',
        },
        sand: { DEFAULT: 'var(--c-sand)', dim: 'var(--c-sand-dim)' },
        paper: { DEFAULT: 'var(--c-paper)', dim: 'var(--c-paper-dim)' },
        teal: { DEFAULT: 'var(--c-teal)', bright: 'var(--c-teal-bright)' },
        gold: 'var(--c-gold)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
      },
      fontFamily: {
        ui: 'var(--f-ui)',
        display: 'var(--f-display)',
      },
      maxWidth: {
        measure: 'var(--measure)',
        container: 'var(--container)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};
