import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211B',
        cream: '#F6F7F2',
        lime: '#C8F169',
        moss: '#315B47',
        muted: '#6D786F'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 12px 35px rgba(23, 33, 27, 0.07)'
      }
    }
  },
  plugins: []
} satisfies Config;
