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
        line: { DEFAULT: 'var(--c-line)', strong: 'var(--c-line-strong)' },
      },
      fontFamily: {
        ui: 'var(--f-ui)',
        display: 'var(--f-display)',
      },
      fontSize: {
        eyebrow: ['var(--t-eyebrow)', { lineHeight: '1.2', letterSpacing: '0.16em' }],
        small: ['var(--t-small)', { lineHeight: '1.55' }],
        body: ['var(--t-body)', { lineHeight: '1.65' }],
        lead: ['var(--t-lead)', { lineHeight: '1.55' }],
        h2: ['var(--t-h2)', { lineHeight: '1.12' }],
        h1: ['var(--t-h1)', { lineHeight: '1.06' }],
        strike: ['var(--t-strike)', { lineHeight: '1.18' }],
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
