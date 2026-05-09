/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        progressFill: {
          from: { width: '0%' },
          to:   { width: 'var(--tw-progress-width)' },
        },
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out both',
        'slide-up':      'slideUp 0.25s ease-out both',
        'slide-in-left': 'slideInLeft 0.2s ease-out both',
        shimmer:         'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
