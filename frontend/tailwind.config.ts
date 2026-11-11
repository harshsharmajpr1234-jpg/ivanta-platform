import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.ts', './src/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        // ControlZ Exact Signature Colors
        accent: {
          DEFAULT: '#0000FF',       // ControlZ Signature Electric Cobalt Blue (--cz-blue)
          hover: '#0000cc',
          soft: '#D8E5FF',          // ControlZ Soft Light Blue Accent (--cz-lblue)
          border: '#B3CEFF',
        },
        ink: {
          DEFAULT: '#000000',       // Deep Pure Black (--cz-black)
          dark: '#111111',          // Charcoal Dark (--cz-fab-bg)
          soft: '#3A3A3A',
          muted: '#717171',         // ControlZ Muted Text Gray (--cz-gray)
          faint: '#8E8E93',
        },
        surface: {
          DEFAULT: '#FFFFFF',       // Crisp White (--cz-white)
          card: '#FFFFFF',
          sunk: '#F4F4F4',          // ControlZ Light Gray Section BG (--cz-lgray)
          dark: '#000000',          // ControlZ Dark Section BG (--cz-bg)
        },
        line: { 
          DEFAULT: '#E5E7EB',       // Modern Light Gray Border
          strong: '#D1D5DB',
          dark: 'rgba(255, 255, 255, 0.16)', // Dark Section Line (--cz-line)
        },
        success: { DEFAULT: '#10B981', soft: '#E0F4E8' },
        warning: { DEFAULT: '#F59E0B', soft: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px rgba(0, 0, 0, 0.06)',
        pop: '0 12px 40px rgba(0, 0, 0, 0.12)',
        blue: '0 8px 30px rgba(0, 0, 255, 0.25)',
      },
      borderRadius: {
        xl2: '14px',
        xl3: '18px',
        xl4: '22px', // ControlZ Border Radius (--cz-r)
      },
    },
  },
  plugins: [],
};
export default config;
