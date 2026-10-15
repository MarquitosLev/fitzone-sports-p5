/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fitzone: {
          navy: '#1B2A55',
          'navy-dark': '#111A36',
          'navy-light': '#263B72',
          coral: '#F26D6D',
          'coral-hover': '#e05959',
          'coral-light': '#FEEAEA',
          gold: '#F0B429',
          'gold-light': '#FEF7E6',
          green: '#2E9E5B',
          'green-light': '#EAF7EE',
          red: '#E5484D',
          'red-light': '#FDECEE',
          gray: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          }
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 8px 30px rgba(27, 42, 85, 0.08)',
        'card-hover': '0 16px 36px rgba(27, 42, 85, 0.16)',
        'modal': '0 24px 48px -12px rgba(27, 42, 85, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
