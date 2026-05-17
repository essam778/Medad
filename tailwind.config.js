/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink:        'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        gold:       'var(--color-gold)',
        'gold-light':'var(--color-gold-light)',
        paper:      'var(--color-paper)',
        'paper-soft':'var(--color-paper-soft)',
        border:     'var(--color-border)',
        card:       'var(--color-bg-card)',
        subtle:     'var(--color-bg-subtle)',
      },
      textColor: {
        primary:   'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted:     'var(--color-text-muted)',
      },
      backgroundColor: {
        page:   'var(--color-bg)',
        card:   'var(--color-bg-card)',
        subtle: 'var(--color-bg-subtle)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        arabic: 'var(--font-arabic)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'var(--color-text-primary)',
            a: { color: 'var(--color-ink)', textDecoration: 'underline' },
            h2: { fontFamily: 'Georgia, serif' },
            h3: { fontFamily: 'Georgia, serif' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
