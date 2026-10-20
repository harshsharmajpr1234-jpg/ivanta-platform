import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.ts', './src/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0b5cff',
          hover: '#0046d6',
          soft: '#eaf1ff',
          border: '#c5d8ff',
        },
        ink: {
          DEFAULT: '#1d1d1f',
          soft: '#424245',
          muted: '#6e6e73',
          faint: '#86868b',
        },
        surface: {
          DEFAULT: '#fbfbfd',
          card: '#ffffff',
          sunk: '#f5f5f7',
        },
        line: { DEFAULT: '#e4e4e7', strong: '#d2d2d7' },
        success: { DEFAULT: '#1a7f37', soft: '#e8f5ec' },
        warning: { DEFAULT: '#b45309', soft: '#fdf3e3' },
        danger: { DEFAULT: '#c62f2f', soft: '#fdecec' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        card: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07)',
        pop: '0 12px 40px rgba(0,0,0,0.14)',
      },
      borderRadius: { xl2: '14px', xl3: '18px', xl4: '24px' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,.8,.36,1) both',
        'fade-in': 'fade-in .3s ease both',
        'slide-in-right': 'slide-in-right .3s cubic-bezier(.22,.8,.36,1) both',
        'slide-up': 'slide-up .3s cubic-bezier(.22,.8,.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
