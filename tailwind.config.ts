import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1A3C5E', light: '#2A5278', 50: '#EEF3F8', 100: '#D5E3EF', 600: '#163451', 700: '#122B44' },
        accent: { DEFAULT: '#F59E0B', dark: '#D97706' },
        slate: '#F8FAFC',
        dark: '#1E293B',
        muted: '#64748B',
      },
      fontFamily: {
        display: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      container: { center: true, padding: '1.25rem' },
    },
  },
  plugins: [],
}
export default config
