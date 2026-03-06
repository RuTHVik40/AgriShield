/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: Emerald scale
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',  // Main primary
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Accent: Amber scale
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main accent
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Dark backgrounds
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          800: '#0f1a14',  // Deepest dark
          850: '#0a1a10',
          900: '#061209',
          950: '#020a04',
        },
        // Soil tones
        soil: {
          100: '#fdf4e7',
          200: '#f5ddb0',
          300: '#e8c07a',
          400: '#d4a043',
          500: '#b5832a',
        },
        // Danger/pest alert
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern':    "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'leaf-pattern':    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23047857' fill-opacity='0.08'%3E%3Cpath d='M30 0C13.4 0 0 13.4 0 30s13.4 30 30 30 30-13.4 30-30S46.6 0 30 0zm0 54C16.7 54 6 43.3 6 30S16.7 6 30 6s24 10.7 24 24-10.7 24-24 24z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'hero-gradient':   'linear-gradient(135deg, #022c22 0%, #0a1a10 50%, #047857 100%)',
        'card-gradient':   'linear-gradient(145deg, rgba(4,120,87,0.1) 0%, rgba(5,150,105,0.05) 100%)',
        'glass-gradient':  'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(4,120,87,0.4), 0 0 40px rgba(4,120,87,0.2)',
        'glow-amber':  '0 0 20px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.2)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.2)',
        'glass':       '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line':       'scanLine 2s ease-in-out infinite',
        'float':           'float 6s ease-in-out infinite',
        'shimmer':         'shimmer 2s linear infinite',
        'radar-ping':      'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in-up':      'fadeInUp 0.6s ease-out forwards',
        'slide-in-right':  'slideInRight 0.4s ease-out forwards',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(200px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        radarPing: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
