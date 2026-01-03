/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette - Arcane/IDE inspired with warm accents
        'surface': {
          DEFAULT: '#0f0f12',
          50: '#1a1a1f',
          100: '#16161b',
          200: '#121217',
          300: '#0f0f12',
          400: '#0a0a0d',
        },
        'accent': {
          primary: '#e8b931',     // Golden amber
          secondary: '#c97435',   // Burnt orange
          tertiary: '#8b5cf6',    // Violet
          success: '#10b981',     // Emerald
          warning: '#f59e0b',     // Amber
          danger: '#ef4444',      // Red
        },
        'text': {
          primary: '#f5f5f7',
          secondary: '#a1a1aa',
          tertiary: '#71717a',
          muted: '#52525b',
        },
        'border': {
          DEFAULT: '#27272a',
          subtle: '#1f1f23',
          accent: '#3f3f46',
        }
      },
      fontFamily: {
        'display': ['Clash Display', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'body': ['Satoshi', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, rgba(232, 185, 49, 0.03) 0%, transparent 50%, rgba(139, 92, 246, 0.03) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(232, 185, 49, 0.15) 0%, transparent 70%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(232, 185, 49, 0.3)',
        'glow-lg': '0 0 60px -15px rgba(232, 185, 49, 0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
